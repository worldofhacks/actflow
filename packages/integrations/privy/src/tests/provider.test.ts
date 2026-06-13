import assert from "node:assert/strict";
import { test } from "node:test";
import { isAddress } from "viem";
import { MockWalletProvider, type IWalletProvider } from "@actflow/sdk";
import { PrivyWalletProvider, createPrivyWalletProvider } from "../provider.js";
import { createMockWallet } from "../mock-wallet.js";

/**
 * UNIT: IWalletProvider conformance of the MOCK Privy provider. NO live Privy or
 * Arc calls — mock mode only. Verifies the provider matches the exact interface
 * exported by @actflow/sdk (getAddress/getBalance/pay) and tags mock results.
 */

function mockProvider(label?: string): PrivyWalletProvider {
  // Empty env -> mock mode, regardless of the ambient process env.
  return new PrivyWalletProvider({ env: {}, label });
}

test("constructs in mock mode with empty env", () => {
  const p = mockProvider();
  assert.equal(p.mode, "mock");
});

test("structurally assignable to IWalletProvider", () => {
  // Compile-time + runtime: the provider IS an IWalletProvider.
  const p: IWalletProvider = mockProvider();
  assert.equal(typeof p.getAddress, "function");
  assert.equal(typeof p.getBalance, "function");
  assert.equal(typeof p.pay, "function");
});

test("getAddress returns a valid, deterministic 0x address", async () => {
  const a1 = await mockProvider("agent-A").getAddress();
  const a2 = await mockProvider("agent-A").getAddress();
  const b = await mockProvider("agent-B").getAddress();
  assert.ok(isAddress(a1), "address is a valid EVM address");
  assert.equal(a1, a2, "same label -> deterministic address");
  assert.notEqual(a1, b, "different labels -> different addresses");
});

test("mock address matches the standalone mock-wallet derivation", async () => {
  const fromProvider = await mockProvider("agent-C").getAddress();
  const fromHelper = createMockWallet("agent-C").address;
  assert.equal(fromProvider, fromHelper);
});

test("getBalance returns a mock-tagged WalletBalance", async () => {
  const bal = await mockProvider().getBalance();
  assert.equal(bal.mock, true);
  assert.equal(bal.symbol, "USDC");
  assert.equal(typeof bal.amount, "string");
});

test("getBalance honors a custom token symbol", async () => {
  const bal = await mockProvider().getBalance("EURC");
  assert.equal(bal.symbol, "EURC");
  assert.equal(bal.mock, true);
});

test("pay returns a mock-tagged PaymentResult, never presented as real", async () => {
  const p = mockProvider("payer");
  const r = await p.pay({
    to: "0x2222222222222222222222222222222222222222",
    amount: "0.05",
  });
  assert.equal(r.mock, true);
  assert.match(r.txHash, /^0x[0-9a-fA-F]{64}$/);
});

test("pay is deterministic for a fresh provider but advances a nonce", async () => {
  const a = mockProvider("payer");
  const first = await a.pay({ to: "0x3333333333333333333333333333333333333333", amount: "1" });
  const second = await a.pay({ to: "0x3333333333333333333333333333333333333333", amount: "1" });
  // Same params, different nonce -> different hash (no accidental dedupe).
  assert.notEqual(first.txHash, second.txHash);

  // A fresh provider replays the first hash (deterministic from nonce 0).
  const fresh = mockProvider("payer");
  const replay = await fresh.pay({ to: "0x3333333333333333333333333333333333333333", amount: "1" });
  assert.equal(replay.txHash, first.txHash);
});

test("createPrivyWalletProvider factory also yields a mock provider", async () => {
  const p = createPrivyWalletProvider({ env: {} });
  assert.equal(p.mode, "mock");
  assert.ok(isAddress(await p.getAddress()));
});

test("the agents MockWalletProvider satisfies the same interface (sanity)", async () => {
  const m: IWalletProvider = new MockWalletProvider();
  const r = await m.pay({ to: "0x0", amount: "0" });
  assert.equal(r.mock, true);
});
