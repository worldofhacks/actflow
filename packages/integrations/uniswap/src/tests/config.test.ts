import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadUniswapConfig,
  requireApiKey,
  resolveSwapChainId,
  getTokenAddress,
  tokenOverrideEnv,
  DEFAULT_SWAP_CHAIN_ID,
  SUPPORTED_CHAINS,
  UNISWAP_BASE_URL,
} from "../config.js";

/**
 * UNIT: config + chain + token resolution. Proves the default swap chain comes
 * from UNISWAP_SWAP_CHAIN_ID (default Base Sepolia), token lookups are
 * config/env-driven, and the API key is env-only.
 */

test("defaults swap chain to Base Sepolia (84532) when unset", () => {
  const cfg = loadUniswapConfig({});
  assert.equal(cfg.swapChainId, DEFAULT_SWAP_CHAIN_ID);
  assert.equal(cfg.swapChainId, 84532);
  assert.equal(cfg.swapChain.name, "Base Sepolia");
  assert.equal(cfg.swapChain.testnet, true);
});

test("base URL defaults to the SKILL constant", () => {
  const cfg = loadUniswapConfig({});
  assert.equal(cfg.baseUrl, UNISWAP_BASE_URL);
  assert.equal(cfg.baseUrl, "https://trade-api.gateway.uniswap.org/v1");
});

test("UNISWAP_BASE_URL env overrides the default", () => {
  const cfg = loadUniswapConfig({ UNISWAP_BASE_URL: "https://proxy.example/v1" });
  assert.equal(cfg.baseUrl, "https://proxy.example/v1");
});

test("UNISWAP_SWAP_CHAIN_ID resolves a supported chain", () => {
  const cfg = loadUniswapConfig({ UNISWAP_SWAP_CHAIN_ID: "1" });
  assert.equal(cfg.swapChainId, 1);
  assert.equal(cfg.swapChain.name, "Ethereum");
});

test("resolveSwapChainId rejects an unsupported chain id", () => {
  assert.throws(() => resolveSwapChainId({ UNISWAP_SWAP_CHAIN_ID: "999999" }));
});

test("resolveSwapChainId rejects a non-integer chain id", () => {
  assert.throws(() => resolveSwapChainId({ UNISWAP_SWAP_CHAIN_ID: "abc" }));
});

test("API key comes from UNISWAP_API_KEY only", () => {
  assert.equal(loadUniswapConfig({}).apiKey, undefined);
  const cfg = loadUniswapConfig({ UNISWAP_API_KEY: "k-123" });
  assert.equal(cfg.apiKey, "k-123");
  assert.equal(requireApiKey(cfg), "k-123");
});

test("requireApiKey throws when unset", () => {
  assert.throws(() => requireApiKey(loadUniswapConfig({})));
});

test("token map lookups: USDC/WETH on the chains we use", () => {
  // mainnet (chainId 1) — from SKILL Addresses & Chain Config
  assert.equal(
    getTokenAddress("USDC", 1, {}),
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  );
  assert.match(getTokenAddress("WETH", 1, {})!, /^0x[0-9a-fA-F]{40}$/);
  // Base Sepolia (default testnet)
  assert.match(getTokenAddress("USDC", 84532, {})!, /^0x[0-9a-fA-F]{40}$/);
  assert.match(getTokenAddress("WETH", 84532, {})!, /^0x[0-9a-fA-F]{40}$/);
  // Ethereum Sepolia
  assert.match(getTokenAddress("USDC", 11155111, {})!, /^0x[0-9a-fA-F]{40}$/);
  assert.match(getTokenAddress("WETH", 11155111, {})!, /^0x[0-9a-fA-F]{40}$/);
});

test("token map returns undefined for an unknown chain", () => {
  assert.equal(getTokenAddress("USDC", 137, {}), undefined);
});

test("token address env override wins over the map", () => {
  const env = tokenOverrideEnv("USDC", 1);
  assert.equal(env, "UNISWAP_TOKEN_USDC_1");
  const addr = getTokenAddress("USDC", 1, {
    [env]: "0x1111111111111111111111111111111111111111",
  });
  assert.equal(addr, "0x1111111111111111111111111111111111111111");
});

test("malformed token override throws", () => {
  assert.throws(() =>
    getTokenAddress("USDC", 1, { [tokenOverrideEnv("USDC", 1)]: "0xnope" }),
  );
});

test("supported chains include mainnet + the three testnets we use", () => {
  for (const id of [1, 84532, 11155111]) {
    assert.ok(SUPPORTED_CHAINS[id], `expected chain ${id} supported`);
  }
});
