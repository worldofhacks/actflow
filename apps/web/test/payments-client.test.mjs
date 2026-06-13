// Hire / pay / receipt frontend client tests.
//
// Runner: Node 22 native `node --test` with on-the-fly TypeScript type-stripping
// (no jest/vitest in this repo). These tests NEVER hit apps/api, Arc, Privy or
// World — `globalThis.fetch` is always mocked. We exercise the real client
// module (lib/payments/client.ts) to lock in the request shapes / endpoints,
// the auth header, the 402-as-data behaviour, query building and error mapping.
//
// Run:  export PATH=/home/actlabs/.nvm/versions/node/v22.22.3/bin:$PATH
//       node --experimental-strip-types --test apps/web/test/payments-client.test.mjs

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

process.env.NEXT_PUBLIC_API_URL = 'http://api.test';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientUrl = pathToFileURL(path.join(here, '..', 'lib', 'payments', 'client.ts')).href;
const typesUrl = pathToFileURL(path.join(here, '..', 'types', 'payments', 'index.ts')).href;

const { PaymentApiError, hire, settle, getReceipts, getReceipt } = await import(clientUrl);
const { isPaymentRequired } = await import(typesUrl);

/** Install a mock fetch that records calls and returns a canned Response-like object. */
function mockFetch({ ok = true, status = 200, body = {} } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    return { ok, status, json: async () => body };
  };
  return calls;
}

beforeEach(() => {
  delete globalThis.fetch;
});

const sampleChallenge = {
  status: 402,
  scheme: 'eip3009-transferWithAuthorization',
  network: 'evm',
  chainId: 5042002,
  amount: '50000',
  amountDecimal: '0.05',
  recipient: '0x1111111111111111111111111111111111111111',
  asset: {
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    symbol: 'USDC',
    domainName: 'USD Coin',
    domainVersion: '2',
  },
  resource: 'task:42',
  validAfter: 0,
  validBefore: 1718300000,
  nonce: '0x' + 'ab'.repeat(32),
};

// --- hire ----------------------------------------------------------------------

test('hire returns a 402 challenge AS DATA (does not throw) and the guard detects it', async () => {
  const calls = mockFetch({
    ok: false,
    status: 402,
    body: { status: 402, challenge: sampleChallenge, settle: { endpoint: '/payments/settle', method: 'POST' } },
  });
  const res = await hire({ agentAddress: '0xabc', resource: 'task:42', price: '0.05' }, { accessToken: 'jwt' });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://api.test/payments/hire');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer jwt');
  assert.ok(isPaymentRequired(res));
  assert.equal(res.challenge.amount, '50000');
});

test('hire returns a 200 world-trial unlock as data', async () => {
  mockFetch({
    ok: true,
    status: 200,
    body: { status: 200, method: 'world-trial', unlocked: true, freeTrialsRemaining: 2, receipt: { id: 'r1', mock: true } },
  });
  const res = await hire({ resource: 'task:42', worldNullifier: '0xnull', worldAction: 'free-trial' });
  assert.equal(isPaymentRequired(res), false);
  assert.equal(res.method, 'world-trial');
  assert.equal(res.freeTrialsRemaining, 2);
});

test('hire forwards the World nullifier + action in the request body', async () => {
  const calls = mockFetch({ ok: true, status: 200, body: { status: 200, method: 'world-trial', unlocked: true, freeTrialsRemaining: 1, receipt: {} } });
  await hire({ resource: 'task:1', worldNullifier: '0xnull', worldAction: 'free-trial' });
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.worldNullifier, '0xnull');
  assert.equal(sent.worldAction, 'free-trial');
});

test('hire throws a typed error on a real (non-402) failure', async () => {
  mockFetch({ ok: false, status: 500, body: { message: 'boom' } });
  await assert.rejects(
    () => hire({ resource: 'x' }),
    (err) => err instanceof PaymentApiError && err.status === 500 && err.message === 'boom',
  );
});

// --- settle --------------------------------------------------------------------

test('settle posts the challenge + payload and returns the receipt + mock flag', async () => {
  const calls = mockFetch({
    ok: true,
    status: 200,
    body: { paid: true, unlocked: true, mock: true, receipt: { id: 'r2', mock: true, method: 'x402' } },
  });
  const payload = { scheme: 'eip3009-transferWithAuthorization', network: 'evm', chainId: 5042002, asset: sampleChallenge.asset.address, authorization: {}, signature: '0xsig', mock: true };
  const res = await settle({ challenge: sampleChallenge, payload, resource: 'task:42' });

  assert.equal(calls[0].url, 'http://api.test/payments/settle');
  const sent = JSON.parse(calls[0].init.body);
  assert.deepEqual(sent.challenge, sampleChallenge);
  assert.equal(sent.payload.mock, true);
  assert.equal(res.paid, true);
  assert.equal(res.mock, true);
  assert.equal(res.receipt.id, 'r2');
});

test('settle returns paid:false verification failures as data (with reason)', async () => {
  mockFetch({ ok: true, status: 200, body: { paid: false, unlocked: false, mock: true, reason: 'amount mismatch' } });
  const res = await settle({ challenge: sampleChallenge, payload: {} });
  assert.equal(res.paid, false);
  assert.equal(res.reason, 'amount mismatch');
  assert.equal(res.receipt, undefined);
});

// --- receipts ------------------------------------------------------------------

test('getReceipts builds a payer/agent query and returns the array', async () => {
  const calls = mockFetch({ ok: true, status: 200, body: [{ id: 'r1' }, { id: 'r2' }] });
  const res = await getReceipts({ payer: '0xpayer', agent: '0xagent', limit: 10 });
  const url = new URL(calls[0].url);
  assert.equal(url.pathname, '/payments/receipts');
  assert.equal(url.searchParams.get('payer'), '0xpayer');
  assert.equal(url.searchParams.get('agent'), '0xagent');
  assert.equal(url.searchParams.get('limit'), '10');
  assert.equal(res.length, 2);
});

test('getReceipt fetches a single receipt by id and maps 404 to a typed error', async () => {
  mockFetch({ ok: true, status: 200, body: { id: 'r9' } });
  const ok = await getReceipt('r9');
  assert.equal(ok.id, 'r9');

  mockFetch({ ok: false, status: 404, body: { message: 'not found' } });
  await assert.rejects(
    () => getReceipt('missing'),
    (err) => err instanceof PaymentApiError && err.status === 404,
  );
});
