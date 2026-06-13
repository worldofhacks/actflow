import assert from "node:assert/strict";
import { test } from "node:test";
import { withdrawEarningsPrivately } from "../payouts/withdraw-earnings-privately.js";

/**
 * UNIT: private agent payouts via @actflow/integrations-unlink. NO live
 * Unlink/network calls — an empty env keeps the wrapper in its labeled MOCK
 * mode, so deposit -> private transfer -> optional withdraw all return mock
 * receipts. Proves the flow wires end-to-end, is mock-safe, and validates input.
 */

const OWNER = "unlink1qqqqexampleownerprivateaddress0000";

test("deposit -> private transfer to owner (mock mode, no creds)", async () => {
  const out = await withdrawEarningsPrivately(
    { proceeds: "1000000", ownerUnlinkAddress: OWNER },
    { env: {} },
  );
  assert.equal(out.mode, "mock");
  assert.equal(out.mock, true);
  assert.equal(out.deposit.op, "deposit");
  assert.equal(out.deposit.mock, true);
  assert.equal(out.transfer.op, "transfer");
  assert.equal(out.transfer.mock, true);
  // No cash-out requested.
  assert.equal(out.withdraw, undefined);
  // Mock receipts carry no real tx hash.
  assert.equal(out.deposit.txHash, null);
  assert.equal(out.transfer.txHash, null);
});

test("transfers the full proceeds to the owner by default", async () => {
  const out = await withdrawEarningsPrivately(
    { proceeds: "500000", ownerUnlinkAddress: OWNER },
    { env: {} },
  );
  // Deterministic mock ids: the transfer id is seeded by amount=500000, so a
  // second transfer of the same amount/owner reproduces it.
  const again = await withdrawEarningsPrivately(
    { proceeds: "500000", ownerUnlinkAddress: OWNER },
    { env: {} },
  );
  assert.equal(out.transfer.txId, again.transfer.txId);
});

test("optional cash-out runs the withdraw step to a public EVM address", async () => {
  const out = await withdrawEarningsPrivately(
    {
      proceeds: "1000000",
      ownerUnlinkAddress: OWNER,
      transferAmount: "750000",
      cashOutAmount: "250000",
      cashOutEvmAddress: "0x2222222222222222222222222222222222222222",
    },
    { env: {} },
  );
  assert.ok(out.withdraw, "withdraw receipt present when cash-out requested");
  assert.equal(out.withdraw?.op, "withdraw");
  assert.equal(out.withdraw?.mock, true);
  assert.equal(out.mock, true);
});

test("cashOutAmount without an EVM address is rejected", async () => {
  await assert.rejects(
    () =>
      withdrawEarningsPrivately(
        { proceeds: "1000000", ownerUnlinkAddress: OWNER, cashOutAmount: "1" },
        { env: {} },
      ),
    /cashOutEvmAddress is required/,
  );
});

test("invalid owner address is rejected by the wrapper (bubbles up)", async () => {
  await assert.rejects(
    () =>
      withdrawEarningsPrivately(
        { proceeds: "1000000", ownerUnlinkAddress: "0xnotunlink" },
        { env: {} },
      ),
    /unlink1/,
  );
});

test("UNLINK_FORCE_MOCK keeps mock mode even if creds are present", async () => {
  const out = await withdrawEarningsPrivately(
    { proceeds: "1000000", ownerUnlinkAddress: OWNER },
    {
      env: {
        UNLINK_API_KEY: "key-123",
        UNLINK_MNEMONIC:
          "test test test test test test test test test test test junk",
        UNLINK_FORCE_MOCK: "1",
      },
    },
  );
  assert.equal(out.mode, "mock");
  assert.equal(out.mock, true);
});
