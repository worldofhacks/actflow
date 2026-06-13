import assert from "node:assert/strict";
import { test } from "node:test";
import { createWalletTools } from "../tools/wallet-actions.js";
import {
  MockWalletProvider,
  type IWalletProvider,
} from "../interfaces/wallet-provider.js";
import { createPrivyWalletProvider } from "@actflow/integrations-privy";
import { build402Challenge } from "@actflow/integrations-x402";

/**
 * UNIT: wallet tools over an injected IWalletProvider. NO live Privy/Arc calls —
 * every provider here runs in its labeled MOCK mode (empty env / X402_FORCE_MOCK
 * implied by the non-signing provider). Covers provider conformance, the pay
 * receipt in mock mode, the no-provider graceful path, and the x402 pay helper.
 */

// Tool.execute receives the validated input directly (Mastra v1). Tests call it
// directly; the `any` cast keeps the tests decoupled from Mastra's generics.
async function exec(tool: unknown, input: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tool as any).execute(input);
}

// A mock Privy provider (empty env -> mock mode, ignores ambient process env).
function mockPrivy(label?: string) {
  return createPrivyWalletProvider({ env: {}, label });
}

test("PrivyWalletProvider conforms to IWalletProvider (constructable as walletProvider)", () => {
  // Compile-time + runtime: the Privy provider IS an IWalletProvider, so it can
  // be passed straight into createWalletTools / defineActflowAgent.
  const provider: IWalletProvider = mockPrivy("conformance");
  assert.equal(typeof provider.getAddress, "function");
  assert.equal(typeof provider.getBalance, "function");
  assert.equal(typeof provider.pay, "function");
  // It wires into the wallet toolset without error.
  const tools = createWalletTools(provider);
  assert.ok(tools.getBalance && tools.pay && tools.payX402);
});

test("getBalance calls the injected provider and carries through mock + address", async () => {
  const provider = mockPrivy("balance-agent");
  const tools = createWalletTools(provider);

  const out = await exec(tools.getBalance, {});
  assert.equal(out.symbol, "USDC");
  assert.equal(typeof out.amount, "string");
  // The provider's mock flag is surfaced verbatim — never invented by the tool.
  assert.equal(out.mock, true);
  // Address comes from the provider, deterministic for the label.
  assert.equal(out.address, await provider.getAddress());
});

test("getBalance honors a custom token symbol through the provider", async () => {
  const tools = createWalletTools(mockPrivy("token-agent"));
  const out = await exec(tools.getBalance, { token: "EURC" });
  assert.equal(out.symbol, "EURC");
  assert.equal(out.mock, true);
});

test("pay returns a mock-tagged receipt in mock mode (never presented as real)", async () => {
  const tools = createWalletTools(mockPrivy("payer"));
  const out = await exec(tools.pay, {
    to: "0x2222222222222222222222222222222222222222",
    amount: "0.05",
  });
  assert.equal(out.mock, true);
  // A well-formed 32-byte hash from the mock provider — clearly labeled mock.
  assert.match(out.txHash, /^0x[0-9a-fA-F]{64}$/);
});

test("no-provider path is graceful: defaults to the labeled MockWalletProvider", async () => {
  // createWalletTools() with NO provider must not throw and must return a clearly
  // mock balance/receipt (no creds, no funds) so tests pass without a wallet.
  const tools = createWalletTools();
  const balance = await exec(tools.getBalance, {});
  assert.equal(balance.mock, true);
  assert.equal(balance.symbol, "USDC");
  assert.equal(
    balance.address,
    "0x0000000000000000000000000000000000000000",
  );

  const receipt = await exec(tools.pay, {
    to: "0x1111111111111111111111111111111111111111",
    amount: "1.00",
  });
  assert.equal(receipt.mock, true);
  assert.equal(receipt.txHash, "0xMOCK_PAYMENT");
});

test("payX402 signs a 402 challenge via the wallet provider and tags the mock payload", async () => {
  const provider = mockPrivy("x402-payer");
  const tools = createWalletTools(provider);

  // Build a deterministic 402 challenge (Arc USDC defaults, no env, fixed nonce).
  const challenge = build402Challenge({
    amount: "0.05",
    recipient: "0x4444444444444444444444444444444444444444",
    resource: "https://api.example/report",
    env: {},
    now: 1_000_000,
    nonce: ("0x" + "ab".repeat(32)) as `0x${string}`,
  });

  const out = await exec(tools.payX402, { challenge });
  assert.equal(out.paid, true);
  // The IWalletProvider cannot sign typed data -> a labeled MOCK payload.
  assert.equal(out.mock, true);
  assert.ok(out.payload, "a signed payload is returned");
  assert.equal(out.payload.mock, true);
  assert.equal(out.payload.scheme, "eip3009-transferWithAuthorization");
  // Authorization is bound to the payer's address and the challenge recipient.
  assert.equal(out.payload.authorization.from, await provider.getAddress());
  assert.equal(out.payload.authorization.to, challenge.recipient);
  assert.equal(out.payload.authorization.value, challenge.amount);
  // 65-byte signature shape (mock signature is well-formed but not valid secp256k1).
  assert.match(out.payload.signature, /^0x[0-9a-fA-F]{130}$/);
});

test("payX402 also works with the default MockWalletProvider (no provider injected)", async () => {
  const tools = createWalletTools();
  const challenge = build402Challenge({
    amount: "1",
    recipient: "0x5555555555555555555555555555555555555555",
    resource: "res://x",
    env: {},
    now: 2_000_000,
    nonce: ("0x" + "cd".repeat(32)) as `0x${string}`,
  });
  const out = await exec(tools.payX402, { challenge });
  assert.equal(out.paid, true);
  assert.equal(out.mock, true);
  assert.equal(
    out.payload.authorization.from,
    "0x0000000000000000000000000000000000000000",
  );
});

test("payX402 reports a reason (paid:false) when the wallet cannot resolve an address", async () => {
  // A wallet provider whose getAddress throws drives signPaymentAuthorization's
  // error path inside execute — the tool catches it and returns a labeled
  // failure (paid:false, reason) instead of throwing. No network/live calls.
  const brokenProvider: IWalletProvider = {
    async getAddress() {
      throw new Error("wallet unavailable");
    },
    async getBalance() {
      return { symbol: "USDC", amount: "0.00", mock: true };
    },
    async pay() {
      return { txHash: "0xMOCK", mock: true };
    },
  };
  const tools = createWalletTools(brokenProvider);
  const challenge = build402Challenge({
    amount: "1",
    recipient: "0x6666666666666666666666666666666666666666",
    resource: "res://y",
    env: {},
    now: 3_000_000,
    nonce: ("0x" + "ef".repeat(32)) as `0x${string}`,
  });
  const out = await exec(tools.payX402, { challenge });
  assert.equal(out.paid, false);
  assert.ok(/wallet unavailable/i.test(out.reason));
  assert.equal(out.payload, undefined);
});
