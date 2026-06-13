import assert from "node:assert/strict";
import { test } from "node:test";
import { parseUnits } from "viem";
import { build402Challenge } from "../challenge.js";
import { ARC_TESTNET_DEFAULTS, ENV } from "../config.js";

/**
 * UNIT: 402 challenge construction. Offline. Proves Arc/USDC defaults, base-unit
 * conversion, deadline math, validation, and env-driven overrides.
 */

const RECIPIENT = "0x1111111111111111111111111111111111111111" as const;

test("builds an Arc USDC 402 descriptor with defaults", () => {
  const c = build402Challenge({
    amount: "0.05",
    recipient: RECIPIENT,
    resource: "https://api.actflow.test/premium",
    now: 1_000_000,
  });
  assert.equal(c.status, 402);
  assert.equal(c.scheme, "eip3009-transferWithAuthorization");
  assert.equal(c.network, "evm");
  assert.equal(c.chainId, 5042002);
  assert.equal(c.recipient, RECIPIENT);
  assert.equal(c.asset.address, ARC_TESTNET_DEFAULTS.usdcAddress);
  assert.equal(c.asset.decimals, 6);
  assert.equal(c.asset.symbol, "USDC");
  // 0.05 USDC at 6 decimals = 50000 base units.
  assert.equal(c.amount, parseUnits("0.05", 6).toString());
  assert.equal(c.amount, "50000");
  assert.equal(c.amountDecimal, "0.05");
  assert.equal(c.validAfter, 0);
  assert.equal(c.validBefore, 1_000_000 + 600);
  assert.match(c.nonce, /^0x[0-9a-fA-F]{64}$/);
});

test("ttlSeconds controls validBefore", () => {
  const c = build402Challenge({
    amount: "1",
    recipient: RECIPIENT,
    resource: "r",
    now: 500,
    ttlSeconds: 120,
  });
  assert.equal(c.validBefore, 620);
});

test("amountInBaseUnits is honored and back-formatted", () => {
  const c = build402Challenge({
    amount: "250000",
    recipient: RECIPIENT,
    resource: "r",
    amountInBaseUnits: true,
  });
  assert.equal(c.amount, "250000");
  assert.equal(c.amountDecimal, "0.25");
});

test("chainId override is reflected", () => {
  const c = build402Challenge({
    amount: "1",
    recipient: RECIPIENT,
    resource: "r",
    chainId: 84532,
  });
  assert.equal(c.chainId, 84532);
});

test("env overrides drive asset address + chain id", () => {
  const c = build402Challenge({
    amount: "1",
    recipient: RECIPIENT,
    resource: "r",
    env: {
      [ENV.chainId]: "99999",
      [ENV.usdcAddress]: "0x2222222222222222222222222222222222222222",
    },
  });
  assert.equal(c.chainId, 99999);
  assert.equal(c.asset.address, "0x2222222222222222222222222222222222222222");
});

test("provided nonce is used verbatim", () => {
  const nonce = ("0x" + "ab".repeat(32)) as `0x${string}`;
  const c = build402Challenge({
    amount: "1",
    recipient: RECIPIENT,
    resource: "r",
    nonce,
  });
  assert.equal(c.nonce, nonce);
});

test("nonces are unique across calls", () => {
  const mk = () =>
    build402Challenge({ amount: "1", recipient: RECIPIENT, resource: "r" }).nonce;
  assert.notEqual(mk(), mk());
});

test("rejects bad recipient / empty resource / non-positive amount / bad ttl", () => {
  assert.throws(() =>
    build402Challenge({ amount: "1", recipient: "0xnope" as never, resource: "r" }),
  );
  assert.throws(() =>
    build402Challenge({ amount: "1", recipient: RECIPIENT, resource: "  " }),
  );
  assert.throws(() =>
    build402Challenge({
      amount: "0",
      recipient: RECIPIENT,
      resource: "r",
    }),
  );
  assert.throws(() =>
    build402Challenge({
      amount: "1",
      recipient: RECIPIENT,
      resource: "r",
      ttlSeconds: 0,
    }),
  );
});

test("includes description when provided", () => {
  const c = build402Challenge({
    amount: "1",
    recipient: RECIPIENT,
    resource: "r",
    description: "premium research call",
  });
  assert.equal(c.description, "premium research call");
});
