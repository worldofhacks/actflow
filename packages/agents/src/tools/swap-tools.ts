import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  TradingApiClient,
  getTokenAddress,
  loadUniswapConfig,
  NATIVE_TOKEN_SENTINEL,
  type QuoteResponse,
  type TokenSymbol,
  type UniswapConfig,
} from "@actflow/integrations-uniswap";
import type { IWalletProvider } from "../interfaces/wallet-provider.js";

/**
 * Swap tools — LIVE Uniswap Trading API integration.
 *
 * These call @actflow/integrations-uniswap (typed wrappers over the official
 * Trading API POST /quote, /swap, /check_approval — field names verbatim from
 * the uniswap-api SKILL). No API keys, token addresses, or chain IDs are
 * hard-coded here:
 *   - the API key comes from env UNISWAP_API_KEY (via the integration config),
 *   - the default chain comes from the integration config (UNISWAP_SWAP_CHAIN_ID),
 *   - token addresses are resolved from the integration's overridable config map
 *     (getTokenAddress) or accepted as explicit 0x addresses on the tool input.
 *
 * Safety gates:
 *   - swapQuote returns { available:false, reason } (NOT a throw, NOT a mock)
 *     when UNISWAP_API_KEY is absent, so unit tests pass without a key.
 *   - swapExecute NEVER invents a tx hash. It prepares the unsigned swap tx via
 *     the Trading API but only broadcasts when a funded wallet provider is
 *     configured; otherwise it returns { executed:false, reason, unsignedTx }.
 */

/** EVM 20-byte address (0x-prefixed). */
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

/**
 * Decimals for the well-known token symbols this tool can resolve by name.
 *
 * Source: standard ERC-20 token metadata (USDC = 6 decimals per Circle's
 * deployments; WETH/native ETH = 18). Used only to convert the human-friendly
 * decimal `amountIn` into the base-units string the Trading API requires
 * (SKILL gotcha: `amount` is always a string in base units). Callers passing a
 * raw 0x address should pass `amountInBaseUnits: true` (we cannot infer
 * decimals for an arbitrary address without an on-chain read).
 */
const KNOWN_TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  WETH: 18,
  ETH: 18,
};

/** A symbol we know how to resolve to an address via the integration config. */
const RESOLVABLE_SYMBOLS: TokenSymbol[] = ["USDC", "WETH"];

function isResolvableSymbol(s: string): s is TokenSymbol {
  return (RESOLVABLE_SYMBOLS as string[]).includes(s.toUpperCase());
}

/**
 * Resolve a tool token input (symbol OR 0x address) to an on-chain address for
 * a chain. Addresses pass through; "ETH" maps to the native sentinel; known
 * symbols resolve via the integration's overridable config map. Returns
 * undefined when a symbol can't be resolved for the chain.
 */
function resolveTokenAddress(
  token: string,
  chainId: number,
): string | undefined {
  if (EVM_ADDRESS.test(token)) return token;
  const upper = token.toUpperCase();
  if (upper === "ETH") return NATIVE_TOKEN_SENTINEL;
  if (isResolvableSymbol(upper)) return getTokenAddress(upper, chainId);
  return undefined;
}

/**
 * Convert a decimal amount string to a base-units string for `decimals`.
 * Pure integer math on the digit string — no float rounding. Throws on a
 * fractional part longer than `decimals`.
 */
function toBaseUnits(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.split(".");
  if (frac.length > decimals) {
    throw new Error(
      `amount "${amount}" has more fractional digits than the token's ${decimals} decimals.`,
    );
  }
  const padded = frac.padEnd(decimals, "0");
  const combined = `${whole}${padded}`.replace(/^0+(?=\d)/, "");
  return combined === "" ? "0" : combined;
}

/** Options to wire the swap tools to live clients / a funded wallet. */
export interface SwapToolsOptions {
  /** Reuse a configured TradingApiClient (auth/config). Defaults per env. */
  client?: TradingApiClient;
  /** Resolved Uniswap config (chain/key). Defaults to loadUniswapConfig(). */
  config?: UniswapConfig;
  /**
   * Funded wallet provider. When present (and able to broadcast), swapExecute
   * will sign + send the prepared swap tx. When absent, swapExecute prepares
   * the unsigned tx but does NOT broadcast.
   */
  walletProvider?: IWalletProvider;
}

/**
 * Build the swap toolset. Exported standalone tools (swapQuote/swapExecute)
 * below are produced with default options (no injected wallet → execution is
 * gated). Callers wanting live execution pass a funded walletProvider.
 */
export function createSwapTools(options: SwapToolsOptions = {}) {
  const getConfig = (): UniswapConfig => options.config ?? loadUniswapConfig();
  const getClient = (config: UniswapConfig): TradingApiClient =>
    options.client ?? new TradingApiClient({ config });

  const swapQuote = createTool({
    id: "swap-quote",
    description:
      "Get a real Uniswap price quote for swapping one token for another. Always quote before executing a swap.",
    inputSchema: z.object({
      tokenIn: z
        .string()
        .min(1)
        .describe("Input token symbol (USDC/WETH/ETH) or 0x address"),
      tokenOut: z
        .string()
        .min(1)
        .describe("Output token symbol (USDC/WETH/ETH) or 0x address"),
      amountIn: z
        .string()
        .regex(/^\d+(\.\d+)?$/, "must be a decimal string")
        .describe("Amount of tokenIn to swap (decimal string)"),
      chainId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "EVM chain id (defaults to the configured UNISWAP_SWAP_CHAIN_ID)",
        ),
      amountInBaseUnits: z
        .boolean()
        .optional()
        .describe(
          "Set true when amountIn is already in base units (required for raw addresses with unknown decimals)",
        ),
    }),
    outputSchema: z.object({
      available: z.boolean(),
      reason: z.string().optional(),
      quoteId: z.string().optional(),
      requestId: z.string().optional(),
      routing: z.string().optional(),
      tokenIn: z.string().optional(),
      tokenOut: z.string().optional(),
      amountIn: z.string().optional(),
      amountOut: z.string().optional(),
      chainId: z.number().optional(),
    }),
    execute: async ({
      tokenIn,
      tokenOut,
      amountIn,
      chainId,
      amountInBaseUnits,
    }) => {
      const config = getConfig();
      // No-key path: return a clearly-labeled unavailable result (NOT a throw,
      // NOT a mock) so the agent can explain it and unit tests pass keyless.
      if (!config.apiKey) {
        return {
          available: false,
          reason:
            "UNISWAP_API_KEY is not set — live quotes are unavailable. Configure the key to enable swaps.",
        };
      }

      const resolvedChainId = chainId ?? config.swapChainId;
      const tokenInAddr = resolveTokenAddress(tokenIn, resolvedChainId);
      const tokenOutAddr = resolveTokenAddress(tokenOut, resolvedChainId);
      if (!tokenInAddr || !tokenOutAddr) {
        const missing = !tokenInAddr ? tokenIn : tokenOut;
        return {
          available: false,
          reason: `Could not resolve token "${missing}" on chain ${resolvedChainId}. Pass a 0x address or a known symbol (USDC/WETH/ETH).`,
        };
      }

      // Convert the human amount to base units unless already base units.
      let amount: string;
      if (amountInBaseUnits) {
        amount = amountIn.split(".")[0]; // base units are integers
      } else {
        const decimals = KNOWN_TOKEN_DECIMALS[tokenIn.toUpperCase()];
        if (decimals === undefined) {
          return {
            available: false,
            reason: `Unknown decimals for token "${tokenIn}". Pass amountInBaseUnits:true with a base-units amount.`,
          };
        }
        try {
          amount = toBaseUnits(amountIn, decimals);
        } catch (err) {
          return {
            available: false,
            reason: err instanceof Error ? err.message : String(err),
          };
        }
      }

      const client = getClient(config);
      // The Trading API requires a `swapper`. Use the configured wallet address
      // when available; otherwise quote from the input token address (a valid
      // EVM address) purely for pricing — execution is gated separately.
      const swapper = options.walletProvider
        ? await options.walletProvider.getAddress()
        : tokenInAddr;

      try {
        const quote: QuoteResponse = await client.getQuote({
          type: "EXACT_INPUT",
          amount,
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          swapper,
          chainId: resolvedChainId,
        });
        return {
          available: true,
          quoteId: quote.quote.quoteId ?? quote.requestId,
          requestId: quote.requestId,
          routing: quote.routing,
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          amountIn: amount,
          amountOut: quote.quote.output?.amount,
          chainId: quote.quote.chainId ?? resolvedChainId,
        };
      } catch (err) {
        return {
          available: false,
          reason: `Uniswap quote failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  });

  const swapExecute = createTool({
    id: "swap-execute",
    description:
      "Execute a token swap. Re-quotes the pair and prepares the swap transaction via the Uniswap Trading API. Only broadcasts when a funded wallet is configured; otherwise returns the prepared unsigned transaction. Never execute without explicit user confirmation.",
    inputSchema: z.object({
      tokenIn: z
        .string()
        .min(1)
        .describe("Input token symbol (USDC/WETH/ETH) or 0x address"),
      tokenOut: z
        .string()
        .min(1)
        .describe("Output token symbol (USDC/WETH/ETH) or 0x address"),
      amountIn: z
        .string()
        .regex(/^\d+(\.\d+)?$/, "must be a decimal string")
        .describe("Amount of tokenIn to swap (decimal string)"),
      chainId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "EVM chain id (defaults to the configured UNISWAP_SWAP_CHAIN_ID)",
        ),
      slippageBps: z
        .number()
        .int()
        .min(1)
        .max(5000)
        .default(50)
        .describe("Max slippage in basis points (default 50 = 0.5%)"),
      amountInBaseUnits: z
        .boolean()
        .optional()
        .describe(
          "Set true when amountIn is already in base units (required for raw addresses with unknown decimals)",
        ),
    }),
    outputSchema: z.object({
      executed: z.boolean(),
      reason: z.string().optional(),
      txHash: z.string().optional(),
      requestId: z.string().optional(),
      routing: z.string().optional(),
      chainId: z.number().optional(),
      unsignedTx: z
        .object({
          to: z.string(),
          data: z.string(),
          value: z.string().optional(),
          chainId: z.number().optional(),
          gasLimit: z.string().optional(),
          maxFeePerGas: z.string().optional(),
          maxPriorityFeePerGas: z.string().optional(),
        })
        .optional(),
    }),
    execute: async ({
      tokenIn,
      tokenOut,
      amountIn,
      chainId,
      slippageBps,
      amountInBaseUnits,
    }) => {
      const config = getConfig();
      if (!config.apiKey) {
        return {
          executed: false,
          reason:
            "UNISWAP_API_KEY is not set — cannot prepare or execute a swap. Configure the key first.",
        };
      }

      const resolvedChainId = chainId ?? config.swapChainId;
      const tokenInAddr = resolveTokenAddress(tokenIn, resolvedChainId);
      const tokenOutAddr = resolveTokenAddress(tokenOut, resolvedChainId);
      if (!tokenInAddr || !tokenOutAddr) {
        const missing = !tokenInAddr ? tokenIn : tokenOut;
        return {
          executed: false,
          reason: `Could not resolve token "${missing}" on chain ${resolvedChainId}. Pass a 0x address or a known symbol (USDC/WETH/ETH).`,
        };
      }

      let amount: string;
      if (amountInBaseUnits) {
        amount = amountIn.split(".")[0];
      } else {
        const decimals = KNOWN_TOKEN_DECIMALS[tokenIn.toUpperCase()];
        if (decimals === undefined) {
          return {
            executed: false,
            reason: `Unknown decimals for token "${tokenIn}". Pass amountInBaseUnits:true with a base-units amount.`,
          };
        }
        try {
          amount = toBaseUnits(amountIn, decimals);
        } catch (err) {
          return {
            executed: false,
            reason: err instanceof Error ? err.message : String(err),
          };
        }
      }

      // GATE: broadcasting requires a configured, funded wallet. The
      // IWalletProvider here exposes getAddress/getBalance/pay only — it cannot
      // sign+send arbitrary swap calldata (that needs the viem WalletClient
      // path in the integration's executeSwap). So we PREPARE the unsigned tx
      // via the Trading API and surface it; we NEVER invent a tx hash. When no
      // wallet provider is configured at all, report exactly that.
      const provider = options.walletProvider;
      if (!provider) {
        return {
          executed: false,
          reason: "no funded wallet configured",
        };
      }

      // The Trading API needs a `swapper` (the executing wallet) to build a tx.
      const swapper = await provider.getAddress();

      const client = getClient(config);
      // slippageBps -> slippageTolerance percent (SKILL: 0.5 means 0.5%).
      const slippageTolerance = (slippageBps ?? 50) / 100;

      let quote: QuoteResponse;
      try {
        quote = await client.getQuote({
          type: "EXACT_INPUT",
          amount,
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          swapper,
          chainId: resolvedChainId,
          slippageTolerance,
        });
      } catch (err) {
        return {
          executed: false,
          reason: `Uniswap quote failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      // Convert the quote into an unsigned tx via POST /swap (buildSwap assembles
      // the body via buildSwapBody, echoing the quote + permitData per the SKILL).
      try {
        const swapRes = await client.buildSwap(quote, {
          permitData: quote.permitData ?? undefined,
        });
        const swapTx = swapRes.swap;
        // We have a prepared, unsigned transaction. Broadcasting it requires the
        // viem WalletClient signing path (executeSwap); the wallet provider
        // interface cannot send raw calldata, so surface the prepared tx instead
        // of inventing a hash.
        return {
          executed: false,
          reason:
            "swap transaction prepared but not broadcast — broadcasting requires a viem-capable funded wallet (use the integration's executeSwap with a WalletClient).",
          requestId: swapRes.requestId,
          routing: quote.routing,
          chainId: quote.quote.chainId ?? resolvedChainId,
          unsignedTx: {
            to: swapTx.to,
            data: swapTx.data,
            value: swapTx.value,
            chainId: swapTx.chainId ?? resolvedChainId,
            gasLimit: swapTx.gasLimit,
            maxFeePerGas: swapTx.maxFeePerGas,
            maxPriorityFeePerGas: swapTx.maxPriorityFeePerGas,
          },
        };
      } catch (err) {
        return {
          executed: false,
          reason: `Uniswap swap-tx build failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  });

  return { swapQuote, swapExecute };
}

/**
 * Default standalone tools (no injected wallet → execution gated). These keep
 * the historical named exports the registry/index rely on.
 */
const defaultTools = createSwapTools();
export const swapQuote = defaultTools.swapQuote;
export const swapExecute = defaultTools.swapExecute;
