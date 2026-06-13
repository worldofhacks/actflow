// World ID RP-context signing tests (the /api/world/rp-context route logic).
//
// Runner: Node 22 native `node --test`. NO network: signRequest is pure-JS ECDSA
// signing with no API calls. We assert the mapping from signRequest() output onto
// the RpContext shape the IDKit v4 widget expects.
//
// Run:  node --test apps/web/test/world-rp-context.test.mjs
//       (or from apps/web: node --test test/world-rp-context.test.mjs)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signRequest } from '@worldcoin/idkit/signing';

// A throwaway 32-byte hex key — NOT a real secret, used only to exercise signing.
const TEST_SIGNING_KEY = '0x' + '11'.repeat(32);

/** Mirror of the route's mapping: signRequest -> RpContext. */
function toRpContext(rpId, signed) {
  return {
    rp_id: rpId,
    nonce: signed.nonce,
    created_at: signed.createdAt,
    expires_at: signed.expiresAt,
    signature: signed.sig,
  };
}

test('signRequest produces the fields the RpContext mapping consumes', () => {
  const signed = signRequest({ signingKeyHex: TEST_SIGNING_KEY, action: 'free-trial' });
  assert.equal(typeof signed.sig, 'string');
  assert.ok(signed.sig.startsWith('0x'));
  assert.equal(typeof signed.nonce, 'string');
  assert.ok(signed.nonce.startsWith('0x'));
  assert.equal(typeof signed.createdAt, 'number');
  assert.equal(typeof signed.expiresAt, 'number');
  assert.ok(signed.expiresAt > signed.createdAt);
});

test('toRpContext yields the exact shape IDKitRequestWidget expects', () => {
  const signed = signRequest({ signingKeyHex: TEST_SIGNING_KEY, action: 'free-trial' });
  const ctx = toRpContext('rp_test123', signed);
  assert.deepEqual(Object.keys(ctx).sort(), [
    'created_at',
    'expires_at',
    'nonce',
    'rp_id',
    'signature',
  ]);
  assert.equal(ctx.rp_id, 'rp_test123');
  assert.equal(ctx.signature, signed.sig);
  assert.equal(ctx.nonce, signed.nonce);
});

test('each signRequest call yields a fresh single-use nonce', () => {
  const a = signRequest({ signingKeyHex: TEST_SIGNING_KEY, action: 'free-trial' });
  const b = signRequest({ signingKeyHex: TEST_SIGNING_KEY, action: 'free-trial' });
  assert.notEqual(a.nonce, b.nonce);
});
