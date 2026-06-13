// EIP-3009 payload construction + Arc config helper tests (pure logic).
//
// Runner: Node 22 native `node --test` with TypeScript type-stripping. NO
// network and NO chain access: these exercise pure helpers only (typed-data
// assembly, mock-signature shape, USDC formatting, explorer URLs). Type-only
// imports (@/types/payments) are erased; viem + @actflow/sdk resolve from
// node_modules.
//
// Run:  export PATH=/home/actlabs/.nvm/versions/node/v22.22.3/bin:$PATH
//       node --experimental-strip-types --test apps/web/test/payments-eip3009.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const eip3009Url = pathToFileURL(path.join(here, '..', 'lib', 'payments', 'eip3009.ts')).href;
const arcUrl = pathToFileURL(path.join(here, '..', 'lib', 'config', 'arc.ts')).href;

const {
  EIP3009_TYPES,
  EIP3009_PRIMARY_TYPE,
  buildDomain,
  challengeToMessage,
  buildTypedData,
  buildSignedPayload,
  buildMockPayload,
  mockSignature,
  MOCK_PAYER_PLACEHOLDER,
} = await import(eip3009Url);

const {
  ARC_CHAIN_ID,
  ARC_USDC,
  ARC_USDC_DECIMALS,
  ARC_EXPLORER_BASE,
  explorerTxUrl,
  explorerAddressUrl,
  formatUsdc,
} = await import(arcUrl);

const PAYER = '0x2222222222222222222222222222222222222222';
const challenge = {
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

// --- typed data ----------------------------------------------------------------

test('EIP-3009 type fields + order are the canonical struct', () => {
  assert.equal(EIP3009_PRIMARY_TYPE, 'TransferWithAuthorization');
  assert.deepEqual(
    EIP3009_TYPES.TransferWithAuthorization.map((f) => f.name),
    ['from', 'to', 'value', 'validAfter', 'validBefore', 'nonce'],
  );
});

test('buildDomain reflects the token domain name/version + chain + verifying contract', () => {
  const d = buildDomain(challenge.asset, challenge.chainId);
  assert.equal(d.name, 'USD Coin');
  assert.equal(d.version, '2');
  assert.equal(d.chainId, 5042002);
  assert.equal(d.verifyingContract, challenge.asset.address);
});

test('challengeToMessage maps the challenge into the exact authorization message', () => {
  const m = challengeToMessage(challenge, PAYER);
  assert.deepEqual(m, {
    from: PAYER,
    to: challenge.recipient,
    value: '50000',
    validAfter: '0',
    validBefore: '1718300000',
    nonce: challenge.nonce,
  });
});

test('buildTypedData produces bigint numeric fields viem can sign', () => {
  const td = buildTypedData(challenge, PAYER);
  assert.equal(td.primaryType, 'TransferWithAuthorization');
  assert.equal(typeof td.message.value, 'bigint');
  assert.equal(td.message.value, 50000n);
  assert.equal(td.message.validBefore, 1718300000n);
  assert.equal(td.domain.verifyingContract, challenge.asset.address);
});

// --- payloads ------------------------------------------------------------------

test('buildSignedPayload wraps a real signature with NO mock flag', () => {
  const sig = ('0x' + '11'.repeat(65));
  const p = buildSignedPayload(challenge, PAYER, sig);
  assert.equal(p.signature, sig);
  assert.equal(p.mock, undefined, 'real payloads must not carry mock:true');
  assert.equal(p.asset, challenge.asset.address);
  assert.equal(p.authorization.from, PAYER);
});

test('buildMockPayload is ALWAYS labeled mock:true and 65 bytes', () => {
  const p = buildMockPayload(challenge, PAYER);
  assert.equal(p.mock, true);
  // 0x + 130 hex chars = 65 bytes.
  assert.equal(p.signature.length, 2 + 130);
  assert.match(p.signature, /^0x[0-9a-f]+$/);
});

test('mockSignature is deterministic for the same authorization', () => {
  const m = challengeToMessage(challenge, PAYER);
  assert.equal(mockSignature(m, challenge), mockSignature(m, challenge));
});

test('MOCK_PAYER_PLACEHOLDER is a well-formed address', () => {
  assert.match(MOCK_PAYER_PLACEHOLDER, /^0x[0-9a-fA-F]{40}$/);
});

// --- arc config (config-driven via @actflow/sdk) -------------------------------

test('Arc constants come from the SDK (chain id, USDC address, 6 decimals)', () => {
  assert.equal(ARC_CHAIN_ID, 5042002);
  assert.equal(ARC_USDC.address, '0x3600000000000000000000000000000000000000');
  assert.equal(ARC_USDC_DECIMALS, 6);
});

test('explorer URLs build off the configured base', () => {
  assert.equal(ARC_EXPLORER_BASE, 'https://testnet.arcscan.app');
  assert.equal(explorerTxUrl('0xdead'), 'https://testnet.arcscan.app/tx/0xdead');
  assert.equal(explorerAddressUrl('0xbeef'), 'https://testnet.arcscan.app/address/0xbeef');
});

test('formatUsdc renders 6-dp base units, trimming trailing zeros', () => {
  assert.equal(formatUsdc('50000'), '0.05');
  assert.equal(formatUsdc('1000000'), '1');
  assert.equal(formatUsdc('1500000'), '1.5');
  assert.equal(formatUsdc('0'), '0');
  assert.equal(formatUsdc(1234567n), '1.234567');
});
