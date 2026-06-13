// World ID free-trial frontend client tests.
//
// Runner: Node 22 native `node --test` with on-the-fly TypeScript type-stripping
// (no jest/vitest in this repo). These tests NEVER hit the live World API or the
// backend — `globalThis.fetch` is always mocked. We exercise the real client
// module (lib/world/client.ts) to lock in the request shape (payload forwarded
// AS-IS), auth header, query building, and structured error mapping.
//
// Run:  export PATH=/home/actlabs/.nvm/versions/node/v22.22.3/bin:$PATH
//       node --experimental-strip-types --test apps/web/test/world-client.test.mjs
//       (or from apps/web: node --experimental-strip-types --test test/world-client.test.mjs)

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

process.env.NEXT_PUBLIC_API_URL = 'http://api.test';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientUrl = pathToFileURL(path.join(here, '..', 'lib', 'world', 'client.ts')).href;
const typesUrl = pathToFileURL(path.join(here, '..', 'types', 'world', 'index.ts')).href;

const { WorldApiError, verifyProof, getTrials, consumeTrial } = await import(clientUrl);
const { isTrialAlreadyUsed } = await import(typesUrl);

/** Install a mock fetch that records calls and returns a canned Response-like object. */
function mockFetch({ ok = true, status = 200, body = {} } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    return {
      ok,
      status,
      json: async () => body,
    };
  };
  return calls;
}

beforeEach(() => {
  delete globalThis.fetch;
});

// --- verifyProof ---------------------------------------------------------------

test('verifyProof forwards the IDKit payload AS-IS wrapped as {payload, action}', async () => {
  const calls = mockFetch({
    body: { nullifier: '0xabc', freeTrialsRemaining: 3, credited: true, apiVersion: 'v4' },
  });

  const idkitResult = {
    protocol_version: '4.0',
    nonce: '0xnonce',
    action: 'free-trial',
    responses: [{ identifier: 'proof_of_human', nullifier: '0xabc', proof: ['1', '2', '3', '4', '5'] }],
  };

  const res = await verifyProof(idkitResult, { accessToken: 'jwt123', action: 'free-trial' });

  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, 'http://api.test/world/verify');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, 'Bearer jwt123');
  assert.equal(init.headers['Content-Type'], 'application/json');

  const sent = JSON.parse(init.body);
  // payload must be byte-for-byte the IDKit result (no field remapping).
  assert.deepEqual(sent.payload, idkitResult);
  assert.equal(sent.action, 'free-trial');

  assert.equal(res.nullifier, '0xabc');
  assert.equal(res.freeTrialsRemaining, 3);
  assert.equal(res.apiVersion, 'v4');
});

test('verifyProof omits action when not provided (backend default applies)', async () => {
  const calls = mockFetch({ body: { nullifier: '0x1', freeTrialsRemaining: 3, credited: true, apiVersion: 'v2' } });
  await verifyProof({ proof: 'p', merkle_root: 'm', nullifier_hash: '0x1', verification_level: 'orb' });
  const sent = JSON.parse(calls[0].init.body);
  assert.ok('payload' in sent);
  assert.ok(!('action' in sent), 'action should be omitted so the server default is used');
});

test('verifyProof maps trial-already-used (403) to a typed WorldApiError', async () => {
  mockFetch({ ok: false, status: 403, body: { message: 'used', code: 'already_verified' } });
  await assert.rejects(
    () => verifyProof({}),
    (err) => {
      assert.ok(err instanceof WorldApiError);
      assert.equal(err.status, 403);
      assert.equal(err.code, 'already_verified');
      assert.ok(isTrialAlreadyUsed(err.code));
      return true;
    },
  );
});

test('verifyProof surfaces invalid_proof (400) as a typed error', async () => {
  mockFetch({ ok: false, status: 400, body: { message: 'bad', code: 'invalid_proof' } });
  await assert.rejects(
    () => verifyProof({}),
    (err) => err instanceof WorldApiError && err.code === 'invalid_proof' && err.status === 400,
  );
});

test('verifyProof keeps defaults when the error body is not JSON', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 502,
    json: async () => {
      throw new Error('not json');
    },
  });
  await assert.rejects(
    () => verifyProof({}),
    (err) => err instanceof WorldApiError && err.status === 502 && err.code === 'unknown_error',
  );
});

// --- getTrials -----------------------------------------------------------------

test('getTrials uses the JWT when no nullifier is given (no query string)', async () => {
  const calls = mockFetch({ body: { nullifier: '0xabc', freeTrialsRemaining: 2 } });
  const res = await getTrials({ accessToken: 'jwt' });
  assert.equal(calls[0].url, 'http://api.test/world/trials');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer jwt');
  assert.equal(res.freeTrialsRemaining, 2);
});

test('getTrials appends an encoded nullifier query when provided', async () => {
  const calls = mockFetch({ body: { nullifier: '0xabc', freeTrialsRemaining: 1 } });
  await getTrials({ nullifier: '0xab+c' });
  assert.equal(calls[0].url, 'http://api.test/world/trials?nullifier=0xab%2Bc');
});

// --- consumeTrial --------------------------------------------------------------

test('consumeTrial posts the nullifier and reports paymentRequired handoff', async () => {
  const calls = mockFetch({
    body: { consumed: false, paymentRequired: true, freeTrialsRemaining: 0, nullifier: '0xabc' },
  });
  const res = await consumeTrial('0xabc', { accessToken: 'jwt', action: 'free-trial' });
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(calls[0].url, 'http://api.test/world/consume-trial');
  assert.equal(sent.nullifier, '0xabc');
  assert.equal(sent.action, 'free-trial');
  assert.equal(res.consumed, false);
  assert.equal(res.paymentRequired, true);
});

// --- isTrialAlreadyUsed --------------------------------------------------------

test('isTrialAlreadyUsed recognizes both backend "already used" codes', () => {
  assert.ok(isTrialAlreadyUsed('already_verified'));
  assert.ok(isTrialAlreadyUsed('exceeded_max_verifications'));
  assert.ok(!isTrialAlreadyUsed('invalid_proof'));
  assert.ok(!isTrialAlreadyUsed(undefined));
});
