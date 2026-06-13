import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import {
  TradingApiClient,
  executeSwap,
  loadUniswapConfig,
  getTokenAddress,
  resolveSwapChainId,
} from "../index.js";

/**
 * GATED execution test: runs end-to-end (real broadcast) ONLY when a funded
 * DEPLOYER_PRIVATE_KEY + an RPC for the configured UNISWAP_SWAP_CHAIN_ID are
 * present (UNISWAP_RPC_URL_<chainId> or UNISWAP_SWAP_RPC_URL) AND
 * UNISWAP_API_KEY is set. Otherwise it skips — CI passes WITHOUT funds.
 *
 * SKILL: keys are never read by the library; the test builds the WalletClient
 * + PublicClient and injects them. We DO broadcast here because the gate
 * guarantees a funded wallet; the suite's other tests never broadcast.
 */

const KEY = process.env.DEPLOYER_PRIVATE_KEY?.trim();
const API_KEY = process.env.UNISWAP_API_KEY?.trim();

const CHAIN_ID = (() => {
  try {
    return resolveSwapChainId({
      UNISWAP_SWAP_CHAIN_ID: process.env.UNISWAP_SWAP_CHAIN_ID ?? "",
    });
  } catch {
    return undefined;
  }
})();

const RPC =
  (CHAIN_ID && process.env[`UNISWAP_RPC_URL_${CHAIN_ID}`]?.trim()) ||
  process.env.UNISWAP_SWAP_RPC_URL?.trim();

const enabled = Boolean(KEY && API_KEY && CHAIN_ID && RPC);

/** Find a viem chain by id; fall back to a minimal defineChain wrapper. */
function chainForId(id: number, rpcUrl: string): Chain {
  for (const c of Object.values(chains) as Chain[]) {
    if (c && typeof c === "object" && c.id === id) return c;
  }
  return defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  });
}

test("GATED executeSwap broadcast round-trip", async (t) => {
  if (!enabled) {
    t.skip(
      "executeSwap broadcast disabled — set UNISWAP_API_KEY, DEPLOYER_PRIVATE_KEY, " +
        "UNISWAP_SWAP_CHAIN_ID and an RPC (UNISWAP_RPC_URL_<chainId> or " +
        "UNISWAP_SWAP_RPC_URL) to run. CI passes without funds.",
    );
    return;
  }

  const chain = chainForId(CHAIN_ID!, RPC!);
  const account = privateKeyToAccount(KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC!),
  });
  const publicClient = createPublicClient({ chain, transport: http(RPC!) });

  const client = new TradingApiClient({
    config: loadUniswapConfig({
      UNISWAP_API_KEY: API_KEY,
      UNISWAP_SWAP_CHAIN_ID: String(CHAIN_ID),
    }),
  });

  const usdc = getTokenAddress("USDC", CHAIN_ID!)!;
  const weth = getTokenAddress("WETH", CHAIN_ID!)!;
  const AMOUNT = process.env.UNISWAP_TEST_AMOUNT?.trim() || "1000000"; // 1 USDC

  const quote = await client.getQuote({
    type: "EXACT_INPUT",
    amount: AMOUNT,
    tokenIn: usdc,
    tokenOut: weth,
    swapper: account.address,
    chainId: CHAIN_ID!,
    slippageTolerance: 0.5,
  });

  const result = await executeSwap({
    quote,
    walletClient,
    publicClient,
    client,
    checkApprovalFor: {
      token: usdc,
      amount: AMOUNT,
      chainId: CHAIN_ID!,
      tokenOut: weth,
      tokenOutChainId: CHAIN_ID!,
    },
  });

  assert.ok(result.swapTxHash?.startsWith("0x"), "expected a swap tx hash");
  assert.ok(result.requestId, "expected a /swap requestId");
  console.log(
    `GATED executeSwap: chain=${CHAIN_ID} swapTx=${result.swapTxHash} ` +
      `approvalTx=${result.approvalTxHash ?? "none"} signedPermit=${result.signedPermit}`,
  );
});

test("executeSwap throws clearly without a walletClient", async () => {
  await assert.rejects(
    () =>
      executeSwap({
        quote: { requestId: "x", routing: "CLASSIC", quote: { chainId: 1 } },
        // @ts-expect-error intentionally missing funded wallet
        walletClient: undefined,
        // @ts-expect-error intentionally missing public client
        publicClient: undefined,
      }),
    /requires a funded walletClient/,
  );
});
