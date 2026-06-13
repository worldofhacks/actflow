// World ID server-side verification + free-trial gating tests.
//
// Runner: Node 22 native `node --test` (no jest in this repo). These tests run against the
// COMPILED output in dist/ (so NestJS decorators are already transpiled) and NEVER hit the
// live World API — `fetch` is always mocked.
//
// Run:  pnpm --filter api build && node --test apps/api/test/world.test.mjs
//       (or from apps/api: node --test test/world.test.mjs)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const distWorld = path.join(here, '..', 'dist', 'world');

const { verifyWorldProof, extractNullifier, WorldVerifyError } = require(
  path.join(distWorld, 'world-verify.js'),
);
const { WorldService } = require(path.join(distWorld, 'world.service.js'));

// --- helpers -------------------------------------------------------------------------

/** Build a mock `fetch` that records calls and returns a canned Response-like object. */
function mockFetch({ ok = true, status = 200, body = {} } = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return {
      ok,
      status,
      json: async () => body,
    };
  };
  fn.calls = calls;
  return fn;
}

/** Minimal duck-typed WorldConfig. */
function fakeConfig(overrides = {}) {
  return {
    apiHost: 'https://developer.world.org',
    rpId: 'rp_test_123',
    appId: 'app_test_123',
    apiKey: 'api_secret_test',
    actionId: 'free-trial',
    freeTrialsPerHuman: 3,
    ...overrides,
  };
}

/**
 * In-memory WorldTrialRepository mirroring the real atomic semantics:
 *  - creditIfNew: credit ONLY on first insert (no re-credit)
 *  - decrementIfAvailable: decrement only when >=1 (>=0 floor)
 */
function fakeRepo() {
  const store = new Map(); // key = `${action}|${nullifier}`
  const key = (a, n) => `${a}|${n}`;
  return {
    store,
    async creditIfNew({ action, nullifierHash, freeTrials, apiVersion, userId }) {
      const k = key(action, nullifierHash);
      const existing = store.get(k);
      if (existing) {
        return { doc: existing, credited: false };
      }
      const doc = {
        action,
        nullifierHash,
        freeTrialsRemaining: freeTrials,
        apiVersion,
        userId,
        createdAt: new Date(),
      };
      store.set(k, doc);
      return { doc, credited: true };
    },
    async decrementIfAvailable(action, nullifierHash) {
      const k = key(action, nullifierHash);
      const doc = store.get(k);
      if (!doc || doc.freeTrialsRemaining < 1) return null;
      doc.freeTrialsRemaining -= 1;
      return doc;
    },
    async findByNullifier(action, nullifierHash) {
      return store.get(key(action, nullifierHash)) ?? null;
    },
    async findOneOrNull(action, userId) {
      for (const doc of store.values()) {
        if (doc.action === action && String(doc.userId) === String(userId)) return doc;
      }
      return null;
    },
  };
}

// --- pure verify helper --------------------------------------------------------------

test('extractNullifier reads v2, v4 top-level, and v4 results[] shapes', () => {
  assert.equal(extractNullifier({ nullifier_hash: '0xv2' }), '0xv2');
  assert.equal(extractNullifier({ nullifier: '0xv4' }), '0xv4');
  assert.equal(
    extractNullifier({ results: [{ code: 'x' }, { nullifier: '0xres' }] }),
    '0xres',
  );
  assert.equal(extractNullifier({}), undefined);
  assert.equal(extractNullifier(null), undefined);
});

test('verifyWorldProof posts to v4 endpoint with Bearer auth and returns nullifier (MOCKED)', async () => {
  const fetchMock = mockFetch({
    ok: true,
    status: 200,
    body: { success: true, action: 'free-trial', nullifier: '0xnull_abc', results: [] },
  });
  const target = {
    apiHost: 'https://developer.world.org',
    rpId: 'rp_test_123',
    apiKey: 'api_secret_test',
    action: 'free-trial',
  };

  const res = await verifyWorldProof({ proof: 'p', merkle_root: 'm' }, target, fetchMock);

  assert.equal(res.nullifier, '0xnull_abc');
  assert.equal(res.apiVersion, 'v4');
  assert.equal(fetchMock.calls.length, 1);
  const call = fetchMock.calls[0];
  assert.equal(call.url, 'https://developer.world.org/api/v4/verify/rp_test_123');
  assert.equal(call.init.headers['Authorization'], 'Bearer api_secret_test');
  // Forwarded as-is + server-enforced action injected.
  const sent = JSON.parse(call.init.body);
  assert.equal(sent.proof, 'p');
  assert.equal(sent.merkle_root, 'm');
  assert.equal(sent.action, 'free-trial');
});

test('verifyWorldProof falls back to v2 endpoint when rpId is unset (MOCKED)', async () => {
  const fetchMock = mockFetch({
    ok: true,
    status: 200,
    body: { success: true, nullifier_hash: '0xv2null' },
  });
  const target = {
    apiHost: 'https://developer.world.org',
    appId: 'app_test_123',
    apiKey: 'k',
    action: 'free-trial',
  };

  const res = await verifyWorldProof({ proof: 'p' }, target, fetchMock);

  assert.equal(res.apiVersion, 'v2');
  assert.equal(res.nullifier, '0xv2null');
  assert.equal(fetchMock.calls[0].url, 'https://developer.world.org/api/v2/verify/app_test_123');
});

test('verifyWorldProof rejects on World failure with the World error code (MOCKED)', async () => {
  const fetchMock = mockFetch({
    ok: false,
    status: 400,
    body: { success: false, code: 'invalid_proof', detail: 'bad proof' },
  });
  const target = { apiHost: 'https://developer.world.org', rpId: 'rp_x', action: 'free-trial' };

  await assert.rejects(
    () => verifyWorldProof({ proof: 'bad' }, target, fetchMock),
    (err) => {
      assert.ok(err instanceof WorldVerifyError);
      assert.equal(err.code, 'invalid_proof');
      assert.equal(err.httpStatus, 400);
      return true;
    },
  );
});

test('verifyWorldProof maps already_verified to 403 (trial already used) (MOCKED)', async () => {
  const fetchMock = mockFetch({
    ok: false,
    status: 400,
    body: { success: false, code: 'already_verified' },
  });
  const target = { apiHost: 'https://developer.world.org', rpId: 'rp_x', action: 'free-trial' };

  await assert.rejects(
    () => verifyWorldProof({ proof: 'x' }, target, fetchMock),
    (err) => {
      assert.equal(err.code, 'already_verified');
      assert.equal(err.httpStatus, 403);
      return true;
    },
  );
});

// --- service: verify + credit / dedup / consume --------------------------------------

test('verifyAndCredit credits 3 trials for a brand-new nullifier (MOCKED World)', async () => {
  const repo = fakeRepo();
  const fetchMock = mockFetch({
    ok: true,
    status: 200,
    body: { success: true, nullifier: '0xhuman1' },
  });
  const svc = new WorldService(fakeConfig(), repo, fetchMock);

  const out = await svc.verifyAndCredit({ proof: 'p' }, 'free-trial');

  assert.equal(out.nullifier, '0xhuman1');
  assert.equal(out.freeTrialsRemaining, 3);
  assert.equal(out.credited, true);
  assert.equal(out.apiVersion, 'v4');
});

test('nullifier uniqueness: a second verify of the same nullifier does NOT re-credit', async () => {
  const repo = fakeRepo();
  const fetchMock = mockFetch({
    ok: true,
    status: 200,
    body: { success: true, nullifier: '0xhuman1' },
  });
  const svc = new WorldService(fakeConfig(), repo, fetchMock);

  const first = await svc.verifyAndCredit({ proof: 'p' }, 'free-trial');
  assert.equal(first.freeTrialsRemaining, 3);
  assert.equal(first.credited, true);

  // Consume one so we can prove the re-verify returns CURRENT remaining, not a fresh 3.
  await svc.consumeFreeTrial('0xhuman1', 'free-trial');

  const second = await svc.verifyAndCredit({ proof: 'p' }, 'free-trial');
  assert.equal(second.credited, false, 'second verify must not credit again');
  assert.equal(second.freeTrialsRemaining, 2, 'returns current remaining, not a re-credit');
});

test('verifyAndCredit throws an HttpException carrying the World error on failure', async () => {
  const repo = fakeRepo();
  const fetchMock = mockFetch({
    ok: false,
    status: 400,
    body: { success: false, code: 'invalid_proof' },
  });
  const svc = new WorldService(fakeConfig(), repo, fetchMock);

  await assert.rejects(
    () => svc.verifyAndCredit({ proof: 'bad' }, 'free-trial'),
    (err) => {
      // HttpException from @nestjs/common
      assert.equal(err.getStatus(), 400);
      assert.equal(err.getResponse().code, 'invalid_proof');
      return true;
    },
  );
  // No trial doc should have been created on failure.
  assert.equal(repo.store.size, 0);
});

test('consumeFreeTrial decrements to 0 then reports payment required (>=0 floor)', async () => {
  const repo = fakeRepo();
  const fetchMock = mockFetch({
    ok: true,
    status: 200,
    body: { success: true, nullifier: '0xhuman2' },
  });
  const svc = new WorldService(fakeConfig({ freeTrialsPerHuman: 3 }), repo, fetchMock);

  await svc.verifyAndCredit({ proof: 'p' }, 'free-trial');

  const c1 = await svc.consumeFreeTrial('0xhuman2', 'free-trial');
  assert.deepEqual([c1.consumed, c1.paymentRequired, c1.freeTrialsRemaining], [true, false, 2]);

  const c2 = await svc.consumeFreeTrial('0xhuman2', 'free-trial');
  assert.deepEqual([c2.consumed, c2.paymentRequired, c2.freeTrialsRemaining], [true, false, 1]);

  const c3 = await svc.consumeFreeTrial('0xhuman2', 'free-trial');
  assert.deepEqual([c3.consumed, c3.paymentRequired, c3.freeTrialsRemaining], [true, false, 0]);

  // 4th consume: none left -> payment required, floor stays at 0.
  const c4 = await svc.consumeFreeTrial('0xhuman2', 'free-trial');
  assert.equal(c4.consumed, false);
  assert.equal(c4.paymentRequired, true);
  assert.equal(c4.freeTrialsRemaining, 0);
});

test('consumeFreeTrial for an unknown nullifier reports payment required (no negative)', async () => {
  const repo = fakeRepo();
  const svc = new WorldService(fakeConfig(), repo, mockFetch());

  const res = await svc.consumeFreeTrial('0xneverseen', 'free-trial');
  assert.equal(res.consumed, false);
  assert.equal(res.paymentRequired, true);
  assert.equal(res.freeTrialsRemaining, 0);
});

test('getTrialsByNullifier returns current remaining (0 when never verified)', async () => {
  const repo = fakeRepo();
  const fetchMock = mockFetch({ ok: true, status: 200, body: { success: true, nullifier: '0xh' } });
  const svc = new WorldService(fakeConfig(), repo, fetchMock);

  assert.deepEqual(await svc.getTrialsByNullifier('0xh', 'free-trial'), {
    nullifier: '0xh',
    freeTrialsRemaining: 0,
  });

  await svc.verifyAndCredit({ proof: 'p' }, 'free-trial');

  assert.deepEqual(await svc.getTrialsByNullifier('0xh', 'free-trial'), {
    nullifier: '0xh',
    freeTrialsRemaining: 3,
  });
});
