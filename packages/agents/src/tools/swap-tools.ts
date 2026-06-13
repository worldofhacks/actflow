import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Swap tools — CLEARLY-MARKED MOCKS.
 *
 * These return deterministic fake data (`mock: true`) until Phase 4 wires the
 * Uniswap Trading API (quote -> check Permit2 approval -> execute calldata
 * with viem). The schemas below are the stable interface the live
 * implementation must keep.
 */

export const swapQuote = createTool({
  id: "swap-quote",
  description:
    "Get a price quote for swapping one token for another. Always quote before executing a swap.",
  inputSchema: z.object({
    tokenIn: z.string().min(1).describe("Input token symbol or address"),
    tokenOut: z.string().min(1).describe("Output token symbol or address"),
    amountIn: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "must be a decimal string")
      .describe("Amount of tokenIn to swap (decimal string)"),
    chainId: z
      .number()
      .int()
      .positive()
      .default(1)
      .describe("EVM chain id (default 1 = Ethereum mainnet)"),
  }),
  outputSchema: z.object({
    quoteId: z.string(),
    tokenIn: z.string(),
    tokenOut: z.string(),
    amountIn: z.string(),
    amountOut: z.string(),
    chainId: z.number(),
    mock: z.boolean(),
  }),
  execute: async ({ tokenIn, tokenOut, amountIn, chainId }) => {
    // Optional input flows through typed as possibly undefined — re-apply the
    // schema default (1 = Ethereum mainnet) for the non-optional output.
    const resolvedChainId = chainId ?? 1;
    // MOCK: fixed 1:1 rate. Phase 4 replaces this with the Uniswap Trading
    // API /quote endpoint.
    return {
      quoteId: `mock-quote-${Date.now()}`,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut: amountIn,
      chainId: resolvedChainId,
      mock: true,
    };
  },
});

export const swapExecute = createTool({
  id: "swap-execute",
  description:
    "Execute a previously quoted swap. Requires a quoteId from swap-quote. Never execute without an explicit user confirmation.",
  inputSchema: z.object({
    quoteId: z.string().min(1).describe("Quote id returned by swap-quote"),
    slippageBps: z
      .number()
      .int()
      .min(1)
      .max(5000)
      .default(50)
      .describe("Max slippage in basis points (default 50 = 0.5%)"),
  }),
  outputSchema: z.object({
    quoteId: z.string(),
    txHash: z.string(),
    status: z.enum(["submitted", "mocked"]),
    mock: z.boolean(),
  }),
  execute: async ({ quoteId }) => {
    // MOCK: no transaction is signed or sent. Phase 4 replaces this with the
    // Uniswap Trading API /swap calldata executed via the wallet provider.
    return {
      quoteId,
      txHash: "0xMOCK_SWAP_EXECUTE",
      status: "mocked" as const,
      mock: true,
    };
  },
});

export function createSwapTools() {
  return { swapQuote, swapExecute };
}
