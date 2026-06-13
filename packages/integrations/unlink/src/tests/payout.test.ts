import assert from "node:assert/strict";
import { test } from "node:test";
import {
  UnlinkPayout,
  createUnlinkPayout,
  type UnlinkReceipt,
} from "../index.js";
import { DEFAULT_TOKEN, ENV } from "../config.js";

/**
 * UNIT: the private-payout wrapper in MOCK mode. NO live Unlink/network calls —
 * an empty env (no creds) keeps every instance in its labeled mock mode, so
 * deposit/transfer/withdraw return deterministic mock receipts. Also covers the
 * config getters and the deterministic-id property.
 */

// A mock payout (empty env -> mock mode; ignores ambient process env).
function mockPayout() {
  return createUnlinkPayout({ env: {} });
}

function assertMockReceipt(r: UnlinkReceipt, op: UnlinkReceipt["op"]) {
  assert.equal(r.op, op);
  assert.equal(r.mock, true);
  assert.equal(r.status, "mock-processed");
  assert.equal(r.txHash, null, "mock receipts never carry a real tx hash");
  assert.match(r.txId, /^mock-0x[0-9a-fA-F]{64}$/, "mock txId is clearly labeled");
}

test("empty env -> mock mode, with Arc Testnet defaults exposed", () => {
  const p = mockPayout();
  assert.equal(p.mode, "mock");
  assert.equal(p.chainId, 5042002);
  assert.equal(p.environment, "arc-testnet");
  assert.equal(p.token, DEFAULT_TOKEN);
});

test("privateDeposit returns a labeled mock receipt (no real transfer)", async () => {
  const r = await mockPayout().privateDeposit({ amount: "1000000" });
  assertMockReceipt(r, "deposit");
});

test("privateTransfer to an unlink1 address returns a labeled mock receipt", async () => {
  const r = await mockPayout().privateTransfer({
    toUnlinkAddress: "unlink1qqqqexampleownerprivateaddress0000",
    amount: "750000",
  });
  assertMockReceipt(r, "transfer");
});

test("privateWithdraw to an EVM address returns a labeled mock receipt", async () => {
  const r = await mockPayout().privateWithdraw({
    toEvmAddress: "0x2222222222222222222222222222222222222222",
    amount: "250000",
  });
  assertMockReceipt(r, "withdraw");
});

test("mock receipts are deterministic for identical inputs (reproducible in tests)", async () => {
  const a = await mockPayout().privateDeposit({ amount: "1000000" });
  const b = await mockPayout().privateDeposit({ amount: "1000000" });
  assert.equal(a.txId, b.txId);
  // Different amount -> different id.
  const c = await mockPayout().privateDeposit({ amount: "2000000" });
  assert.notEqual(a.txId, c.txId);
});

test("full deposit -> private transfer -> withdraw sequence works in mock mode", async () => {
  const p = mockPayout();
  const dep = await p.privateDeposit({ amount: "1000000" });
  const xfer = await p.privateTransfer({
    toUnlinkAddress: "unlink1qqqqexampleownerprivateaddress0000",
    amount: "750000",
  });
  const wd = await p.privateWithdraw({
    toEvmAddress: "0x3333333333333333333333333333333333333333",
    amount: "250000",
  });
  assertMockReceipt(dep, "deposit");
  assertMockReceipt(xfer, "transfer");
  assertMockReceipt(wd, "withdraw");
});

test("UNLINK_FORCE_MOCK keeps mock mode even with creds present", async () => {
  const p = createUnlinkPayout({
    env: {
      [ENV.apiKey]: "key-123",
      [ENV.mnemonic]: "test test test test test test test test test test test junk",
      [ENV.forceMock]: "1",
    },
  });
  assert.equal(p.mode, "mock");
  const r = await p.privateDeposit({ amount: "1000000" });
  assertMockReceipt(r, "deposit");
});

test("constructable as a class (not only via the factory)", async () => {
  const p = new UnlinkPayout({ env: {} });
  assert.equal(p.mode, "mock");
  const r = await p.privateTransfer({
    toUnlinkAddress: "unlink1abc",
    amount: "1",
  });
  assert.equal(r.mock, true);
});
