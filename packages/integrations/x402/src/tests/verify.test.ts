import assert from "node:assert/strict";
import { test } from "node:test";
import { privateKeyToAccount } from "viem/accounts";
import { MockWalletProvider } from "@actflow/agents";
import { build402Challenge } from "../challenge.js";
import { signPaymentAuthorization } from "../sign.js";
import { verifyPayment, type PaymentSettler } from "../verify.js";
import { TRANSFER_WITH_AUTHORIZATION_ABI } from "../eip3009.js";

/**
 * UNIT: verifyPayment accept/reject. Offline. Covers mock-receipt acceptance,
 * each rejection branch (wrong amount/recipient/asset/chain/nonce/expired), and
 * a REAL-signature recovery + simulated settlement path (settler is a stub).
 */

const RECIPIENT = "0x6666666666666666666666666666666666666666" as const;
const NONCE = ("0x" + "ef".repeat(32)) as `0x${string}`;
const NOW = 3_000_000;

function freshChallenge(overrides: Partial<Parameters<typeof build402Challenge>[0]> = {}) {
  return build402Challenge({
    amount: "0.25",
    recipient: RECIPIENT,
    resource: "https://api.actflow.test/task/7",
    now: NOW,
    nonce: NONCE,
    ttlSeconds: 600,
    ...overrides,
  });
}

test("ACCEPT: a mock payload validates to a labeled mock receipt", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, true);
  assert.equal(receipt.mock, true);
  assert.equal(receipt.payer, payload.authorization.from);
  assert.equal(receipt.txHash, undefined); // no settlement in mock
});

test("ACCEPT: validation passes but no settler -> mock receipt", async () => {
  const c = freshChallenge();
  // Real-looking signed payload (not mock-tagged) but no settler supplied.
  const account = privateKeyToAccount(("0x" + "33".repeat(32)) as `0x${string}`);
  const payload = await signPaymentAuthorization(
    { getAddress: async () => account.address, signTypedData: (a: any) => account.signTypedData(a) },
    c,
  );
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, true);
  assert.equal(receipt.mock, true);
});

test("REJECT: wrong amount", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  payload.authorization.value = "999999";
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /amount/);
});

test("REJECT: wrong recipient", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  payload.authorization.to = "0x9999999999999999999999999999999999999999";
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /recipient/);
});

test("REJECT: wrong asset", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  payload.asset = "0x0000000000000000000000000000000000000bad";
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /asset/);
});

test("REJECT: wrong chainId", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  payload.chainId = 1;
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /chainId/);
});

test("REJECT: wrong nonce", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  payload.authorization.nonce = ("0x" + "00".repeat(32)) as `0x${string}`;
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /nonce/);
});

test("REJECT: expired (now > validBefore)", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  const receipt = await verifyPayment(c, payload, { now: c.validBefore + 1 });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /expired/);
});

test("REJECT: not yet valid (now < validAfter)", async () => {
  const c = freshChallenge({ now: NOW });
  // Force a future validAfter window.
  const future = { ...c, validAfter: NOW + 1000 };
  const payload = await signPaymentAuthorization(new MockWalletProvider(), future);
  const receipt = await verifyPayment(future, payload, { now: NOW });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /not yet valid/);
});

test("REJECT: malformed signature", async () => {
  const c = freshChallenge();
  const payload = await signPaymentAuthorization(new MockWalletProvider(), c);
  payload.signature = "0x1234" as `0x${string}`;
  const receipt = await verifyPayment(c, payload, { now: NOW + 10 });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /signature/);
});

test("REAL: recovers payer from a valid signature and settles via the settler", async () => {
  const c = freshChallenge();
  const account = privateKeyToAccount(("0x" + "44".repeat(32)) as `0x${string}`);
  const payload = await signPaymentAuthorization(
    { getAddress: async () => account.address, signTypedData: (a: any) => account.signTypedData(a) },
    c,
  );

  let captured: any;
  const settler: PaymentSettler = {
    async writeContract(args) {
      captured = args;
      return ("0x" + "ab".repeat(32)) as `0x${string}`;
    },
  };
  let waited = false;
  const receipt = await verifyPayment(c, payload, {
    now: NOW + 10,
    settler,
    waitForReceipt: async () => {
      waited = true;
    },
  });

  assert.equal(receipt.paid, true);
  assert.equal(receipt.mock, undefined);
  assert.equal(receipt.payer?.toLowerCase(), account.address.toLowerCase());
  assert.match(receipt.txHash ?? "", /^0x[0-9a-fA-F]{64}$/);
  assert.equal(waited, true);
  // Settler was asked to call transferWithAuthorization on the USDC contract.
  assert.equal(captured.functionName, "transferWithAuthorization");
  assert.equal(captured.address, c.asset.address);
  assert.equal(captured.abi, TRANSFER_WITH_AUTHORIZATION_ABI);
  assert.equal(captured.args[0].toLowerCase(), account.address.toLowerCase());
  assert.equal(captured.args[1], c.recipient);
  assert.equal(captured.args[2], BigInt(c.amount));
});

test("REAL: a signature from the wrong key is rejected on recovery", async () => {
  const c = freshChallenge();
  const signer = privateKeyToAccount(("0x" + "55".repeat(32)) as `0x${string}`);
  const payload = await signPaymentAuthorization(
    { getAddress: async () => signer.address, signTypedData: (a: any) => signer.signTypedData(a) },
    c,
  );
  // Tamper the claimed payer so recovery won't match.
  payload.authorization.from = "0x7777777777777777777777777777777777777777";
  const settler: PaymentSettler = {
    async writeContract() {
      throw new Error("should not settle");
    },
  };
  const receipt = await verifyPayment(c, payload, { now: NOW + 10, settler });
  assert.equal(receipt.paid, false);
  assert.match(receipt.reason ?? "", /does not match/);
});
