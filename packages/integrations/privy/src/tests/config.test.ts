import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveChainConfig,
  resolvePrivyConfig,
  ARC_TESTNET_DEFAULTS,
  ENV,
} from "../config.js";

/**
 * UNIT: config resolution. Proves Arc testnet defaults, env overrides, the
 * secret-gated live/mock decision, and CAIP-2 derivation — all offline.
 */

test("defaults to Arc testnet chain config", () => {
  const c = resolveChainConfig({});
  assert.equal(c.chainId, 5042002);
  assert.equal(c.rpcUrl, ARC_TESTNET_DEFAULTS.rpcUrl);
  assert.equal(c.usdcAddress, ARC_TESTNET_DEFAULTS.usdcAddress);
  assert.equal(c.usdcDecimals, 6);
  assert.equal(c.caip2, "eip155:5042002");
});

test("ARC_TESTNET_RPC_URL / ARC_CHAIN_ID / ARC_USDC_ADDRESS overrides win", () => {
  const c = resolveChainConfig({
    [ENV.rpcUrl]: "https://rpc.example/arc",
    [ENV.chainId]: "12345",
    [ENV.usdcAddress]: "0x1111111111111111111111111111111111111111",
  });
  assert.equal(c.rpcUrl, "https://rpc.example/arc");
  assert.equal(c.chainId, 12345);
  assert.equal(c.caip2, "eip155:12345");
  assert.equal(c.usdcAddress, "0x1111111111111111111111111111111111111111");
});

test("malformed ARC_USDC_ADDRESS throws", () => {
  assert.throws(() => resolveChainConfig({ [ENV.usdcAddress]: "0xnope" }));
});

test("invalid ARC_CHAIN_ID throws", () => {
  assert.throws(() => resolveChainConfig({ [ENV.chainId]: "abc" }));
  assert.throws(() => resolveChainConfig({ [ENV.chainId]: "-1" }));
});

test("mock mode when no creds present", () => {
  const cfg = resolvePrivyConfig({});
  assert.equal(cfg.mode, "mock");
  assert.equal(cfg.creds, undefined);
});

test("mock mode when only one cred present", () => {
  assert.equal(resolvePrivyConfig({ [ENV.appId]: "app" }).mode, "mock");
  assert.equal(resolvePrivyConfig({ [ENV.appSecret]: "sec" }).mode, "mock");
});

test("live mode when both creds present", () => {
  const cfg = resolvePrivyConfig({
    [ENV.appId]: "app-123",
    [ENV.appSecret]: "secret-xyz",
  });
  assert.equal(cfg.mode, "live");
  assert.equal(cfg.creds?.appId, "app-123");
  assert.equal(cfg.creds?.appSecret, "secret-xyz");
});

test("PRIVY_FORCE_MOCK forces mock even with creds", () => {
  const cfg = resolvePrivyConfig({
    [ENV.appId]: "app-123",
    [ENV.appSecret]: "secret-xyz",
    [ENV.forceMock]: "1",
  });
  assert.equal(cfg.mode, "mock");
  assert.equal(cfg.creds, undefined);
});

test("PRIVY_WALLET_ID is carried through", () => {
  const cfg = resolvePrivyConfig({ [ENV.walletId]: "wallet-abc" });
  assert.equal(cfg.walletId, "wallet-abc");
});
