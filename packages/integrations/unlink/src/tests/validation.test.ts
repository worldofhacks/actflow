import assert from "node:assert/strict";
import { test } from "node:test";
import { createUnlinkPayout } from "../index.js";

/**
 * UNIT: input validation. The wrapper rejects obviously-invalid inputs BEFORE
 * touching the (mock or live) client — so a bad amount/address never becomes a
 * silent no-op or a mis-routed payout. All offline.
 */

function mockPayout() {
  return createUnlinkPayout({ env: {} });
}

test("privateDeposit rejects non-base-unit / zero amounts", async () => {
  const p = mockPayout();
  await assert.rejects(() => p.privateDeposit({ amount: "1.5" }), /smallest unit/);
  await assert.rejects(() => p.privateDeposit({ amount: "0" }), /positive/);
  await assert.rejects(() => p.privateDeposit({ amount: "" }), /positive/);
  await assert.rejects(() => p.privateDeposit({ amount: "abc" }), /smallest unit/);
});

test("privateTransfer rejects a non-unlink1 recipient", async () => {
  const p = mockPayout();
  await assert.rejects(
    () => p.privateTransfer({ toUnlinkAddress: "0xabc", amount: "1000000" }),
    /unlink1/,
  );
  await assert.rejects(
    () => p.privateTransfer({ toUnlinkAddress: "", amount: "1000000" }),
    /unlink1/,
  );
});

test("privateTransfer rejects a bad amount before the address is even used", async () => {
  const p = mockPayout();
  await assert.rejects(
    () => p.privateTransfer({ toUnlinkAddress: "unlink1abc", amount: "0" }),
    /positive/,
  );
});

test("privateWithdraw rejects a non-EVM destination", async () => {
  const p = mockPayout();
  await assert.rejects(
    () => p.privateWithdraw({ toEvmAddress: "unlink1abc", amount: "1000000" }),
    /EVM address/,
  );
  await assert.rejects(
    () => p.privateWithdraw({ toEvmAddress: "0xshort", amount: "1000000" }),
    /EVM address/,
  );
});
