import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveChainConfig,
  resolveUnlinkConfig,
  DEFAULT_CHAIN_ID,
  DEFAULT_TOKEN,
  ENV,
} from "../config.js";

/**
 * UNIT: config resolution. Proves the Arc-Testnet default, chain-id->environment
 * mapping, env overrides, the secret-gated live/mock decision, and validation —
 * all offline (no Unlink/network calls).
 */

test("defaults to Arc Testnet chain config (chainId 5042002, arc-testnet, Arc USDC)", () => {
  const c = resolveChainConfig({});
  assert.equal(c.chainId, DEFAULT_CHAIN_ID);
  assert.equal(c.chainId, 5042002);
  assert.equal(c.environment, "arc-testnet");
  assert.equal(c.token, DEFAULT_TOKEN);
});

test("UNLINK_CHAIN_ID maps to the matching Unlink environment", () => {
  assert.equal(resolveChainConfig({ [ENV.chainId]: "84532" }).environment, "base-sepolia");
  assert.equal(
    resolveChainConfig({ [ENV.chainId]: "11155111" }).environment,
    "ethereum-sepolia",
  );
  assert.equal(resolveChainConfig({ [ENV.chainId]: "10143" }).environment, "monad-testnet");
});

test("UNLINK_TOKEN override wins when a valid address", () => {
  const c = resolveChainConfig({
    [ENV.token]: "0x1111111111111111111111111111111111111111",
  });
  assert.equal(c.token, "0x1111111111111111111111111111111111111111");
});

test("malformed UNLINK_TOKEN throws", () => {
  assert.throws(() => resolveChainConfig({ [ENV.token]: "0xnope" }));
});

test("invalid UNLINK_CHAIN_ID throws", () => {
  assert.throws(() => resolveChainConfig({ [ENV.chainId]: "abc" }));
  assert.throws(() => resolveChainConfig({ [ENV.chainId]: "-1" }));
});

test("unsupported (but well-formed) UNLINK_CHAIN_ID throws with the supported list", () => {
  assert.throws(
    () => resolveChainConfig({ [ENV.chainId]: "1" }),
    /no known Unlink environment/,
  );
});

test("mock mode when no creds present", () => {
  const cfg = resolveUnlinkConfig({});
  assert.equal(cfg.mode, "mock");
  assert.equal(cfg.creds, undefined);
});

test("mock mode when only one cred present", () => {
  assert.equal(resolveUnlinkConfig({ [ENV.apiKey]: "k" }).mode, "mock");
  assert.equal(resolveUnlinkConfig({ [ENV.mnemonic]: "m" }).mode, "mock");
});

test("live mode when both API key and mnemonic present", () => {
  const cfg = resolveUnlinkConfig({
    [ENV.apiKey]: "key-123",
    [ENV.mnemonic]: "test test test test test test test test test test test junk",
  });
  assert.equal(cfg.mode, "live");
  assert.equal(cfg.creds?.apiKey, "key-123");
  assert.ok(cfg.creds?.mnemonic.startsWith("test "));
});

test("UNLINK_FORCE_MOCK forces mock even with creds", () => {
  const cfg = resolveUnlinkConfig({
    [ENV.apiKey]: "key-123",
    [ENV.mnemonic]: "test test test test test test test test test test test junk",
    [ENV.forceMock]: "1",
  });
  assert.equal(cfg.mode, "mock");
  assert.equal(cfg.creds, undefined);
});

test("UNLINK_ACCOUNT_INDEX is parsed through to creds", () => {
  const cfg = resolveUnlinkConfig({
    [ENV.apiKey]: "key-123",
    [ENV.mnemonic]: "test test test test test test test test test test test junk",
    [ENV.accountIndex]: "3",
  });
  assert.equal(cfg.creds?.accountIndex, 3);
});

test("invalid UNLINK_ACCOUNT_INDEX throws", () => {
  assert.throws(() =>
    resolveUnlinkConfig({
      [ENV.apiKey]: "key-123",
      [ENV.mnemonic]: "m",
      [ENV.accountIndex]: "-2",
    }),
  );
});
