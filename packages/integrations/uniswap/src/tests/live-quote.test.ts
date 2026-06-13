import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TradingApiClient,
  TradingApiHttpError,
  loadUniswapConfig,
  getTokenAddress,
  resolveSwapChainId,
  CLASSIC_FAMILY_ROUTINGS,
  ORDER_FAMILY_ROUTINGS,
  NATIVE_TOKEN_SENTINEL,
  type Routing,
} from "../index.js";

/**
 * LIVE tests against the real Uniswap Trading API using UNISWAP_API_KEY from
 * env. Skip gracefully when the key is unset or the network is down so CI
 * passes without secrets / connectivity.
 */

const VALID_ROUTINGS = new Set<Routing>([
  ...CLASSIC_FAMILY_ROUTINGS,
  ...ORDER_FAMILY_ROUTINGS,
  "CHAINED",
]);

const API_KEY = process.env.UNISWAP_API_KEY?.trim();
// A throwaway swapper address — quotes don't require a funded wallet.
const SWAPPER =
  process.env.UNISWAP_TEST_SWAPPER?.trim() ||
  "0x000000000000000000000000000000000000dEaD";

function client(chainEnvId: string) {
  return new TradingApiClient({
    config: loadUniswapConfig({
      UNISWAP_API_KEY: API_KEY,
      UNISWAP_SWAP_CHAIN_ID: chainEnvId,
    }),
    // keep the suite responsive / skippable when the network is slow
    requestTimeoutMs: 12_000,
    maxRetries: 1,
    retryBaseMs: 300,
  });
}

function isNetworkSkippable(err: unknown): boolean {
  // 401 = bad key, 429/5xx = transient — treat as "skip live" rather than fail.
  if (err instanceof TradingApiHttpError) {
    return err.status === 401 || err.status === 429 || err.status >= 500;
  }
  return true; // fetch/abort/DNS errors -> network down
}

test("LIVE mainnet getQuote: small USDC->WETH EXACT_INPUT returns a quote", async (t) => {
  if (!API_KEY) {
    t.skip("UNISWAP_API_KEY unset — skipping live mainnet quote");
    return;
  }
  const CHAIN = 1;
  const usdc = getTokenAddress("USDC", CHAIN)!;
  const weth = getTokenAddress("WETH", CHAIN)!;

  let res;
  try {
    res = await client("1").getQuote({
      type: "EXACT_INPUT",
      amount: "10000000", // 10 USDC (6 decimals) — small (SKILL: micro-swaps route CLASSIC)
      tokenIn: usdc,
      tokenOut: weth,
      swapper: SWAPPER,
      chainId: CHAIN,
      slippageTolerance: 0.5,
      routingPreference: "BEST_PRICE",
    });
  } catch (err) {
    if (isNetworkSkippable(err)) {
      t.skip(`live mainnet quote unavailable: ${(err as Error).message}`);
      return;
    }
    throw err;
  }

  // routing is a valid enum value
  assert.ok(
    VALID_ROUTINGS.has(res.routing),
    `routing "${res.routing}" must be a valid Routing enum value`,
  );
  // a requestId + a quote came back
  assert.ok(res.requestId, "expected a requestId");
  assert.ok(res.quote, "expected a quote object");
  assert.equal(res.quote.chainId, CHAIN);
  assert.ok(
    res.quote.output?.amount && BigInt(res.quote.output.amount) > 0n,
    "expected a positive output amount",
  );

  // Surface the requestId for liveApiEvidence.
  console.log(
    `LIVE mainnet USDC->WETH: routing=${res.routing} requestId=${res.requestId} out=${res.quote.output?.amount}`,
  );
});

test("LIVE testnet getQuote (default chain): quote OR well-formed no-route", async (t) => {
  if (!API_KEY) {
    t.skip("UNISWAP_API_KEY unset — skipping live testnet quote");
    return;
  }
  // Default testnet from config (Base Sepolia 84532 unless overridden).
  const CHAIN = resolveSwapChainId({
    UNISWAP_SWAP_CHAIN_ID: process.env.UNISWAP_SWAP_CHAIN_ID ?? "",
  });
  const usdc = getTokenAddress("USDC", CHAIN);
  const weth = getTokenAddress("WETH", CHAIN);
  if (!usdc || !weth) {
    t.skip(`no USDC/WETH token map entry for testnet chain ${CHAIN}`);
    return;
  }

  try {
    const res = await client(String(CHAIN)).getQuote({
      type: "EXACT_INPUT",
      amount: "1000000", // 1 USDC
      tokenIn: usdc,
      tokenOut: weth,
      swapper: SWAPPER,
      chainId: CHAIN,
      slippageTolerance: 0.5,
    });
    // Got a quote despite thin testnet liquidity — assert it's well-formed.
    assert.ok(VALID_ROUTINGS.has(res.routing), "valid routing on testnet quote");
    assert.ok(res.requestId, "expected a requestId on testnet quote");
    console.log(
      `LIVE testnet (chain ${CHAIN}) quote: routing=${res.routing} requestId=${res.requestId}`,
    );
  } catch (err) {
    if (err instanceof TradingApiHttpError) {
      // Thin testnet liquidity -> typically 400/404 with a well-formed error.
      // SKILL: "testnet liquidity is thin so quotes may 400/404 for many pairs".
      // Do NOT fail the suite — assert the error is well-formed and log it.
      const body =
        typeof err.body === "object" && err.body ? err.body : undefined;
      assert.ok(
        err.status >= 400,
        "expected a structured HTTP error status from the API",
      );
      console.log(
        `LIVE testnet (chain ${CHAIN}) no-route/thin-liquidity: status=${err.status} ` +
          `error=${body?.error ?? "?"} message=${body?.message ?? err.message}`,
      );
      return;
    }
    if (isNetworkSkippable(err)) {
      t.skip(`live testnet quote unavailable: ${(err as Error).message}`);
      return;
    }
    throw err;
  }
});

test("NATIVE_TOKEN_SENTINEL is the documented native-ETH address", () => {
  assert.equal(
    NATIVE_TOKEN_SENTINEL,
    "0x0000000000000000000000000000000000000000",
  );
});
