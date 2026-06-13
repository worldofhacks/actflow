// x402 / Arc USDC payment-layer tests.
//
// Runner: Node 22 native `node --test` (no jest in this repo). These tests run against the
// COMPILED output in dist/ and the REAL @actflow/integrations-x402 + @actflow/sdk packages,
// but ONLY exercise their labeled MOCK path (X402_FORCE_MOCK / mock payloads). There are NO
// live Privy/Arc calls and NO funds/creds required — the Mongoose layer and WorldService are
// duck-typed mocks.
//
// Run:  pnpm --filter api build && node --test apps/api/test/payments.test.mjs
//       (or from apps/api: node --test test/payments.test.mjs)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const distPayments = path.join(here, '..', 'dist', 'payments');

const { PaymentsService } = require(path.join(distPayments, 'payments.service.js'));
// GAP 4: the BINDING task-unlock adapter — ties a verified payment / trial into the task flow.
const { TaskUnlockService } = require(path.join(distPayments, 'task-unlock.service.js'));
// The Arc chain + USDC config the service reads via @actflow/sdk (CommonJS).
const sdk = require('@actflow/sdk');
// The ESM x402 package — used here only to sign a MOCK payload for the settle tests.
const x402 = await import('@actflow/integrations-x402');

const AGENT = '0x' + 'a'.repeat(40);
const PAYER = '0x' + 'b'.repeat(40);

// --- helpers -------------------------------------------------------------------------

/** Duck-typed PaymentsConfig backed by @actflow/sdk (no env, mock settlement forced). */
function fakeConfig(overrides = {}) {
  return {
    chainId: sdk.ARC_TESTNET_CHAIN_ID,
    usdcAddress: sdk.ARC_TESTNET_USDC.address,
    usdcDecimals: sdk.ARC_TESTNET_USDC.decimals,
    explorerBaseUrl: sdk.ARC_TESTNET_EXPLORER_URL,
    explorerTxUrl(h) {
      return h ? `${sdk.ARC_TESTNET_EXPLORER_URL.replace(/\/+$/, '')}/tx/${h}` : undefined;
    },
    escrowAddress: undefined,
    defaultPrice: '0.05',
    challengeTtlSeconds: 600,
    forceMock: true, // no funds/creds -> labeled MOCK settlement
    ...overrides,
  };
}

/** In-memory PaymentReceiptRepository mirroring the real surface (newest-first history). */
function fakeRepo() {
  const store = [];
  let id = 0;
  return {
    store,
    async create(doc) {
      const _id = String(++id);
      const saved = { ...doc, _id: { toString: () => _id }, createdAt: new Date(Date.now() + id) };
      store.push(saved);
      return saved;
    },
    async findByIdOrNull(wanted) {
      return store.find((d) => d._id.toString() === wanted) ?? null;
    },
    async findHistory(filter) {
      return store
        .filter(
          (d) =>
            (!filter.payer || d.payer.toLowerCase() === filter.payer.toLowerCase()) &&
            (!filter.agent || d.agent.toLowerCase() === filter.agent.toLowerCase()) &&
            (!filter.userId || d.userId === filter.userId),
        )
        .sort((a, b) => b.createdAt - a.createdAt);
    },
  };
}

/** WorldService stub: returns a scripted consumeFreeTrial outcome. */
function fakeWorld(outcome) {
  return {
    calls: [],
    async consumeFreeTrial(nullifier, action) {
      this.calls.push({ nullifier, action });
      return { nullifier, action, ...outcome };
    },
  };
}

function newService({ config, repo, world } = {}) {
  return new PaymentsService(config ?? fakeConfig(), repo ?? fakeRepo(), world ?? fakeWorld({ consumed: false, paymentRequired: true, freeTrialsRemaining: 0 }));
}

/**
 * In-memory TaskService stub mirroring the surface TaskUnlockService consumes:
 *   unlockTask(taskId, {method,mock})        -> mongo id (or null when no task exists)
 *   attachUnlockReceipt(taskMongoId, receiptId)
 * Seed with `existing` task ids; unlocking flips `unlocked:true` and records method/mock and,
 * later, the receipt id. An unseeded resource returns null (no binding).
 */
function fakeTaskService(existing = ['task:42']) {
  const tasks = new Map();
  let n = 0;
  for (const taskId of existing) {
    tasks.set(taskId, {
      _id: `mongo-${++n}`,
      taskId,
      unlocked: false,
      unlockMethod: undefined,
      unlockMock: undefined,
      unlockReceiptId: undefined,
    });
  }
  return {
    tasks,
    async unlockTask(taskId, data) {
      const t = tasks.get(taskId);
      if (!t) return null;
      t.unlocked = true;
      t.unlockMethod = data.method;
      t.unlockMock = data.mock;
      // Return an ObjectId-like with toString().
      return { toString: () => t._id, _id: t._id };
    },
    async attachUnlockReceipt(taskMongoId, receiptId) {
      const id = taskMongoId.toString();
      for (const t of tasks.values()) if (t._id === id) t.unlockReceiptId = receiptId;
    },
  };
}

// --- 402 challenge shape -------------------------------------------------------------

test('hire (no nullifier) returns an HTTP 402 challenge in Arc USDC (chainId 5042002)', async () => {
  const svc = newService();

  const res = await svc.hire({ agentAddress: AGENT, resource: 'task:1', price: '0.05' });

  assert.equal(res.status, 402);
  const c = res.challenge;
  assert.equal(c.status, 402);
  assert.equal(c.scheme, 'eip3009-transferWithAuthorization');
  assert.equal(c.network, 'evm');
  assert.equal(c.chainId, 5042002, 'Arc testnet chain id from @actflow/sdk');
  // Recipient = the agent being hired; asset = Arc USDC from the SDK; amount in 6dp base units.
  assert.equal(c.recipient.toLowerCase(), AGENT.toLowerCase());
  assert.equal(c.asset.address.toLowerCase(), sdk.ARC_TESTNET_USDC.address.toLowerCase());
  assert.equal(c.asset.decimals, 6);
  assert.equal(c.amount, '50000'); // 0.05 USDC * 1e6
  assert.equal(c.amountDecimal, '0.05');
  assert.equal(c.resource, 'task:1');
  assert.ok(/^0x[0-9a-fA-F]{64}$/.test(c.nonce), 'has a 32-byte nonce');
  assert.ok(c.validBefore > 0, 'has an expiry');
  // And it tells the client where to settle.
  assert.deepEqual(res.settle, { endpoint: '/payments/settle', method: 'POST' });
});

test('hire requires a price (or PAYMENTS_DEFAULT_PRICE) and a valid recipient', async () => {
  const svc = newService({ config: fakeConfig({ defaultPrice: undefined }) });
  await assert.rejects(() => svc.hire({ agentAddress: AGENT, resource: 'task:x' }));

  const svc2 = newService();
  await assert.rejects(() => svc2.hire({ agentAddress: 'not-an-address', resource: 'task:x' }));
});

// --- settle: mock-verified payment unlocks + writes a receipt -------------------------

test('settle with a MOCK-verified payment unlocks the task and writes an x402 receipt', async () => {
  const repo = fakeRepo();
  const svc = newService({ repo });

  // Build the challenge via hire, then sign a labeled MOCK payload (no funds/keys).
  const hire = await svc.hire({ agentAddress: AGENT, resource: 'task:42', price: '0.10' });
  const payload = await x402.signPaymentAuthorization(
    { getAddress: async () => PAYER },
    hire.challenge,
    { forceMock: true },
  );
  assert.equal(payload.mock, true, 'mock signer produces a labeled mock payload');

  const unlocked = [];
  const res = await svc.settle(
    { challenge: hire.challenge, payload },
    async (ctx) => {
      unlocked.push(ctx);
      return 'mongo-task-1';
    },
  );

  assert.equal(res.paid, true);
  assert.equal(res.unlocked, true);
  assert.equal(res.mock, true, 'mock flag carried through (never presented as real)');
  assert.equal(res.txHash, undefined, 'no on-chain tx in mock mode');
  assert.equal(res.explorerUrl, undefined, 'no explorer url for a mock receipt');

  // The unlock hook ran with the right context.
  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].resource, 'task:42');
  assert.equal(unlocked[0].method, 'x402');
  assert.equal(unlocked[0].mock, true);

  // A receipt was persisted with the correct fields.
  assert.equal(repo.store.length, 1);
  const r = res.receipt;
  assert.equal(r.method, 'x402');
  assert.equal(r.agent.toLowerCase(), AGENT.toLowerCase());
  assert.equal(r.payer.toLowerCase(), PAYER.toLowerCase());
  assert.equal(r.amount, '100000'); // 0.10 USDC
  assert.equal(r.asset.toLowerCase(), sdk.ARC_TESTNET_USDC.address.toLowerCase());
  assert.equal(r.chainId, 5042002);
  assert.equal(r.mock, true);
  assert.equal(r.taskId, 'mongo-task-1');
  assert.equal(r.resource, 'task:42');
});

test('settle rejects a payment that does not match its challenge (paid:false, no receipt)', async () => {
  const repo = fakeRepo();
  const svc = newService({ repo });

  const hire = await svc.hire({ agentAddress: AGENT, resource: 'task:9', price: '0.05' });
  const payload = await x402.signPaymentAuthorization(
    { getAddress: async () => PAYER },
    hire.challenge,
    { forceMock: true },
  );
  // Tamper: change the amount so verifyPayment rejects it.
  const tampered = { ...payload, authorization: { ...payload.authorization, value: '999' } };

  const res = await svc.settle({ challenge: hire.challenge, payload: tampered });
  assert.equal(res.paid, false);
  assert.equal(res.unlocked, false);
  assert.ok(res.reason, 'carries a rejection reason');
  assert.equal(repo.store.length, 0, 'no receipt written on failed verification');
});

// --- world-trial path: unlock WITHOUT payment ----------------------------------------

test('hire with a valid worldNullifier unlocks WITHOUT payment (world-trial receipt)', async () => {
  const repo = fakeRepo();
  const world = fakeWorld({ consumed: true, paymentRequired: false, freeTrialsRemaining: 2 });
  const svc = newService({ repo, world });

  const unlocked = [];
  const res = await svc.hire(
    { agentAddress: AGENT, resource: 'task:free', worldNullifier: '0xhuman', worldAction: 'free-trial' },
    async (ctx) => {
      unlocked.push(ctx);
      return 'mongo-free-1';
    },
  );

  assert.equal(res.status, 200, 'free unlock, not a 402');
  assert.equal(res.method, 'world-trial');
  assert.equal(res.unlocked, true);
  assert.equal(res.freeTrialsRemaining, 2);

  // WorldService.consumeFreeTrial was called with the nullifier + action.
  assert.equal(world.calls.length, 1);
  assert.deepEqual(world.calls[0], { nullifier: '0xhuman', action: 'free-trial' });

  // The unlock hook ran for the free path too.
  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].method, 'world-trial');

  // Receipt: method world-trial, zero amount, mock:true, no explorer url.
  const r = res.receipt;
  assert.equal(r.method, 'world-trial');
  assert.equal(r.amount, '0');
  assert.equal(r.mock, true);
  assert.equal(r.explorerUrl, undefined);
  assert.equal(r.taskId, 'mongo-free-1');
  assert.equal(repo.store.length, 1);
});

test('hire falls back to a 402 when the worldNullifier has NO trials left', async () => {
  const world = fakeWorld({ consumed: false, paymentRequired: true, freeTrialsRemaining: 0 });
  const svc = newService({ world });

  const res = await svc.hire({
    agentAddress: AGENT,
    resource: 'task:nofree',
    price: '0.05',
    worldNullifier: '0xspent',
  });

  // One coherent decision: no trial -> payment required.
  assert.equal(res.status, 402);
  assert.equal(res.challenge.chainId, 5042002);
  assert.equal(world.calls.length, 1);
});

// --- receipts listing ----------------------------------------------------------------

test('listReceipts returns history by agent/payer (newest first) and getReceipt by id', async () => {
  const repo = fakeRepo();
  const svc = newService({ repo });

  // Two x402 unlocks + one world-trial, same agent.
  for (const resource of ['task:a', 'task:b']) {
    const hire = await svc.hire({ agentAddress: AGENT, resource, price: '0.05' });
    const payload = await x402.signPaymentAuthorization(
      { getAddress: async () => PAYER },
      hire.challenge,
      { forceMock: true },
    );
    await svc.settle({ challenge: hire.challenge, payload });
  }
  const worldSvc = newService({
    repo,
    world: fakeWorld({ consumed: true, paymentRequired: false, freeTrialsRemaining: 1 }),
  });
  await worldSvc.hire({ agentAddress: AGENT, resource: 'task:c', worldNullifier: '0xh' });

  // By agent: all three, newest first.
  const byAgent = await svc.listReceipts({ agent: AGENT });
  assert.equal(byAgent.length, 3);
  assert.equal(byAgent[0].resource, 'task:c', 'newest first');
  assert.ok(byAgent.every((r) => r.agent.toLowerCase() === AGENT.toLowerCase()));

  // By payer: only the two x402 receipts (world-trial payer is the nullifier).
  const byPayer = await svc.listReceipts({ payer: PAYER });
  assert.equal(byPayer.length, 2);
  assert.ok(byPayer.every((r) => r.method === 'x402'));

  // getReceipt by id.
  const one = await svc.getReceipt(byAgent[0].id);
  assert.equal(one.id, byAgent[0].id);
  assert.equal(one.method, 'world-trial');

  // Missing id -> NotFound.
  await assert.rejects(() => svc.getReceipt('does-not-exist'));
});

test('listReceipts requires at least one filter (payer/agent/user)', async () => {
  const svc = newService();
  await assert.rejects(() => svc.listReceipts({}));
});

// --- GAP 4: BINDING unlock — a settled / trial task is ACTUALLY unlocked ---------------

test('settle BINDS the task: a mock-verified payment marks the task unlocked + funded (not just a receipt)', async () => {
  const repo = fakeRepo();
  const svc = newService({ repo });
  const taskSvc = fakeTaskService(['task:42']);
  const hook = new TaskUnlockService(taskSvc).hook();

  const hire = await svc.hire({ agentAddress: AGENT, resource: 'task:42', price: '0.10' });
  const payload = await x402.signPaymentAuthorization(
    { getAddress: async () => PAYER },
    hire.challenge,
    { forceMock: true },
  );

  const res = await svc.settle({ challenge: hire.challenge, payload }, hook);

  // The payment verified AND the marketplace-side binding decision is real.
  assert.equal(res.paid, true);
  assert.equal(res.unlocked, true, 'binding decision: task was actually unlocked');
  assert.equal(res.taskId, 'mongo-1', 'returns the unlocked task mongo id');

  // The TASK RECORD itself was mutated — not just a receipt written.
  const task = taskSvc.tasks.get('task:42');
  assert.equal(task.unlocked, true, 'task record flipped to unlocked/funded');
  assert.equal(task.unlockMethod, 'x402');
  assert.equal(task.unlockMock, true);

  // The receipt is tied back onto the task (audit) and the receipt points at the task.
  assert.equal(repo.store.length, 1);
  assert.equal(task.unlockReceiptId, res.receipt.id, 'receipt id stamped on the task');
  assert.equal(res.receipt.taskId, 'mongo-1', 'receipt points at the unlocked task');
});

test('hire world-trial BINDS the task: a free trial actually unlocks it (method world-trial)', async () => {
  const repo = fakeRepo();
  const world = fakeWorld({ consumed: true, paymentRequired: false, freeTrialsRemaining: 3 });
  const svc = newService({ repo, world });
  const taskSvc = fakeTaskService(['task:free']);
  const hook = new TaskUnlockService(taskSvc).hook();

  const res = await svc.hire(
    { agentAddress: AGENT, resource: 'task:free', worldNullifier: '0xhuman', worldAction: 'free-trial' },
    hook,
  );

  assert.equal(res.status, 200);
  assert.equal(res.unlocked, true, 'binding decision: free task unlocked');
  assert.equal(res.taskId, 'mongo-1');

  const task = taskSvc.tasks.get('task:free');
  assert.equal(task.unlocked, true, 'task record unlocked via world-trial');
  assert.equal(task.unlockMethod, 'world-trial');
  assert.equal(task.unlockMock, true);
  assert.equal(task.unlockReceiptId, res.receipt.id, 'receipt id stamped on the task');
});

test('an UNPAID task is NOT unlocked: failed verification leaves the task locked + no receipt', async () => {
  const repo = fakeRepo();
  const svc = newService({ repo });
  const taskSvc = fakeTaskService(['task:9']);
  const hook = new TaskUnlockService(taskSvc).hook();

  const hire = await svc.hire({ agentAddress: AGENT, resource: 'task:9', price: '0.05' });
  const payload = await x402.signPaymentAuthorization(
    { getAddress: async () => PAYER },
    hire.challenge,
    { forceMock: true },
  );
  // Tamper -> verification fails -> the task must stay locked.
  const tampered = { ...payload, authorization: { ...payload.authorization, value: '999' } };

  const res = await svc.settle({ challenge: hire.challenge, payload: tampered }, hook);

  assert.equal(res.paid, false);
  assert.equal(res.unlocked, false, 'unpaid task is NOT unlocked');
  const task = taskSvc.tasks.get('task:9');
  assert.equal(task.unlocked, false, 'task record stays locked when unpaid');
  assert.equal(task.unlockMethod, undefined);
  assert.equal(repo.store.length, 0, 'no receipt for a failed payment');
});

test('settle reports unlocked:false (but still writes a receipt) when no task exists yet for the resource', async () => {
  const repo = fakeRepo();
  const svc = newService({ repo });
  const taskSvc = fakeTaskService([]); // no tasks seeded
  const hook = new TaskUnlockService(taskSvc).hook();

  const hire = await svc.hire({ agentAddress: AGENT, resource: 'task:later', price: '0.05' });
  const payload = await x402.signPaymentAuthorization(
    { getAddress: async () => PAYER },
    hire.challenge,
    { forceMock: true },
  );

  const res = await svc.settle({ challenge: hire.challenge, payload }, hook);

  assert.equal(res.paid, true, 'payment still verified');
  assert.equal(res.unlocked, false, 'nothing to bind -> not unlocked');
  assert.equal(res.taskId, undefined);
  assert.equal(repo.store.length, 1, 'receipt is still written');
  assert.equal(res.receipt.taskId, undefined);
});
