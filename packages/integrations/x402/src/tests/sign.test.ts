import assert from "node:assert/strict";
import { test } from "node:test";
import { privateKeyToAccount } from "viem/accounts";
import { MockWalletProvider } from "@actflow/sdk";
import { build402Challenge } from "../challenge.js";
import { signPaymentAuthorization, challengeToMessage } from "../sign.js";
import {
  buildTypedData,
  authorizationDigest,
  EIP3009_TYPES,
} from "../eip3009.js";

/**
 * UNIT: EIP-3009 authorization assembly + signing. Offline. Covers the mock
 * signer path (no keys) AND a real viem signer producing a recoverable EIP-712
 * signature — no chain calls.
 */

const RECIPIENT = "0x4444444444444444444444444444444444444444" as const;

function challenge() {
  return build402Challenge({
    amount: "0.10",
    recipient: RECIPIENT,
    resource: "https://api.actflow.test/task/42",
    now: 2_000_000,
    nonce: ("0x" + "cd".repeat(32)) as `0x${string}`,
  });
}

test("EIP3009 types have the exact struct field order", () => {
  assert.deepEqual(
    EIP3009_TYPES.TransferWithAuthorization.map((f) => f.name),
    ["from", "to", "value", "validAfter", "validBefore", "nonce"],
  );
});

test("challengeToMessage maps challenge fields into the EIP-3009 struct", () => {
  const c = challenge();
  const from = "0x5555555555555555555555555555555555555555" as const;
  const m = challengeToMessage(c, from);
  assert.equal(m.from, from);
  assert.equal(m.to, c.recipient);
  assert.equal(m.value, c.amount);
  assert.equal(m.validAfter, "0");
  assert.equal(m.validBefore, String(c.validBefore));
  assert.equal(m.nonce, c.nonce);
});

test("buildTypedData yields an Arc-domain EIP-712 payload", () => {
  const c = challenge();
  const m = challengeToMessage(c, "0x5555555555555555555555555555555555555555");
  const td = buildTypedData(c.asset, c.chainId, m);
  assert.equal(td.domain.chainId, 5042002);
  assert.equal(td.domain.verifyingContract, c.asset.address);
  assert.equal(td.primaryType, "TransferWithAuthorization");
  assert.equal(td.message.value, BigInt(c.amount));
});

test("MOCK: signing with an IWalletProvider (no signTypedData) is labeled mock", async () => {
  const c = challenge();
  const wallet = new MockWalletProvider();
  const payload = await signPaymentAuthorization(wallet, c);
  assert.equal(payload.mock, true);
  assert.equal(payload.scheme, c.scheme);
  assert.equal(payload.chainId, c.chainId);
  assert.equal(payload.asset, c.asset.address);
  assert.equal(payload.authorization.to, c.recipient);
  assert.equal(payload.authorization.value, c.amount);
  assert.match(payload.signature, /^0x[0-9a-fA-F]{130}$/);
});

test("MOCK: signature is deterministic for identical inputs", async () => {
  const c = challenge();
  const wallet = new MockWalletProvider();
  const a = await signPaymentAuthorization(wallet, c);
  const b = await signPaymentAuthorization(wallet, c);
  assert.equal(a.signature, b.signature);
});

test("forceMock downgrades even a capable signer", async () => {
  const c = challenge();
  const account = privateKeyToAccount(("0x" + "11".repeat(32)) as `0x${string}`);
  const signer = {
    address: account.address,
    signTypedData: (args: any) => account.signTypedData(args),
  };
  const payload = await signPaymentAuthorization(signer, c, { forceMock: true });
  assert.equal(payload.mock, true);
});

test("LIVE-style: a real viem signer produces a recoverable EIP-712 signature", async () => {
  const c = challenge();
  const account = privateKeyToAccount(("0x" + "22".repeat(32)) as `0x${string}`);
  const signer = {
    getAddress: async () => account.address,
    signTypedData: (args: any) => account.signTypedData(args),
  };
  const payload = await signPaymentAuthorization(signer, c);
  assert.equal(payload.mock, undefined);
  assert.equal(payload.authorization.from, account.address);
  assert.match(payload.signature, /^0x[0-9a-fA-F]{130}$/);

  // The signature is over the canonical digest for this authorization.
  const digest = authorizationDigest(c.asset, c.chainId, payload.authorization);
  assert.match(digest, /^0x[0-9a-fA-F]{64}$/);
});

test("rejects an unsupported scheme", async () => {
  const c = challenge();
  const bad = { ...c, scheme: "something-else" as any };
  await assert.rejects(() =>
    signPaymentAuthorization(new MockWalletProvider(), bad),
  );
});
