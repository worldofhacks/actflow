/**
 * Uniswap Trading API chain + token + auth configuration for ActFlow.
 *
 * RULES (enforced by the integration brief):
 *  - ZERO hard-coded API keys — the key is read from `UNISWAP_API_KEY` only.
 *  - ZERO hard-coded chain IDs in call sites — the active swap chain comes from
 *    `UNISWAP_SWAP_CHAIN_ID` (default Base Sepolia 84532, a testnet the API
 *    supports per the uniswap-api SKILL). The SUPPORTED map below is the only
 *    place chain-id literals appear, and each entry cites the SKILL source.
 *  - Token addresses are config/param-driven. A small, clearly-labeled
 *    {USDC, WETH} map is provided for the chains we use, with per-token source
 *    comments. Every value is overridable via env so nothing is locked to a guess.
 *
 * Base URL + endpoint paths + the chain/token tables below are distilled from
 * /home/actlabs/actflow/.claude/skills/uniswap-api/SKILL.md (the authoritative
 * source for this package), which in turn cites the official Uniswap docs +
 * OpenAPI spec.
 */

/**
 * Trading API base URL.
 * SKILL "Setup & Auth": Base URL `https://trade-api.gateway.uniswap.org/v1`
 * (https://developers.uniswap.org/docs/trading/swapping-api/integration-guide).
 */
export const UNISWAP_BASE_URL = "https://trade-api.gateway.uniswap.org/v1" as const;

/** Auth header name. SKILL: `x-api-key: YOUR_API_KEY` (required on every request). */
export const UNISWAP_API_KEY_HEADER = "x-api-key" as const;

/**
 * Native-token sentinel address used by the API for native ETH `tokenIn`.
 * SKILL "Addresses & Chain Config": `0x0000...0000` = native ETH in the doc
 * example (https://developers.uniswap.org/docs/trading/swapping-api/integration-guide).
 */
export const NATIVE_TOKEN_SENTINEL =
  "0x0000000000000000000000000000000000000000" as const;

/** Env var names — single source of truth so callers / docs stay in sync. */
export const ENV = {
  apiKey: "UNISWAP_API_KEY",
  swapChainId: "UNISWAP_SWAP_CHAIN_ID",
  baseUrl: "UNISWAP_BASE_URL",
  // Per-chain RPC override used by executeSwap: UNISWAP_RPC_URL_<chainId>.
  // Token-address overrides: UNISWAP_TOKEN_<SYMBOL>_<chainId>.
} as const;

/** A supported chain entry. `id` is the only place chain-id literals live. */
export interface SupportedChain {
  id: number;
  name: string;
  /** Whether the SKILL lists this as a testnet. */
  testnet: boolean;
}

/**
 * Supported chains (subset ActFlow uses + a few common mainnets).
 *
 * Source: SKILL "Addresses & Chain Config" — supported-chains tables
 * (https://developers.uniswap.org/docs/trading/swapping-api/supported-chains).
 * The SKILL notes "All listed testnets are accessible via the API" even though
 * the Uniswap web UI exposes only Ethereum + Unichain Sepolia.
 */
export const SUPPORTED_CHAINS: Record<number, SupportedChain> = {
  // Mainnets (SKILL supported-chains table)
  1: { id: 1, name: "Ethereum", testnet: false },
  10: { id: 10, name: "OP Mainnet", testnet: false },
  130: { id: 130, name: "Unichain", testnet: false },
  137: { id: 137, name: "Polygon", testnet: false },
  8453: { id: 8453, name: "Base", testnet: false },
  42161: { id: 42161, name: "Arbitrum", testnet: false },
  // Testnets (SKILL: accessible via the API)
  1301: { id: 1301, name: "Unichain Sepolia", testnet: true },
  84532: { id: 84532, name: "Base Sepolia", testnet: true },
  11155111: { id: 11155111, name: "Ethereum Sepolia", testnet: true },
} as const;

/**
 * Default swap chain when `UNISWAP_SWAP_CHAIN_ID` is unset.
 * Base Sepolia (84532) per the brief — a testnet the API supports per the SKILL.
 */
export const DEFAULT_SWAP_CHAIN_ID = 84532 as const;

/** Well-known token symbols this map knows about. */
export type TokenSymbol = "USDC" | "WETH";

/**
 * Well-known token addresses per chain ({USDC, WETH}) for the chains we use.
 *
 * Each address carries a source comment. Mainnet (1) values are taken from the
 * uniswap-api SKILL "Addresses & Chain Config". Testnet values are the
 * canonical Circle/OP/ETH faucet/bridge deployments noted in the per-token
 * comments. EVERY value is overridable via `UNISWAP_TOKEN_<SYMBOL>_<chainId>`,
 * so nothing here is load-bearing if an operator supplies their own.
 */
export const TOKEN_ADDRESSES: Record<
  number,
  Partial<Record<TokenSymbol, `0x${string}`>>
> = {
  // Ethereum mainnet (chainId 1)
  1: {
    // SKILL "Addresses & Chain Config": USDC (Ethereum mainnet) — appears in the
    // OpenAPI spec examples with chainId 1.
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    // SKILL: WETH (Ethereum mainnet) — listed in the SKILL minimal example.
    // (SKILL marks this UNVERIFIED in fetched docs; this is the canonical WETH9
    // address — override via UNISWAP_TOKEN_WETH_1 if your deployment differs.)
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  // Base Sepolia (chainId 84532)
  84532: {
    // Circle official testnet USDC for Base Sepolia
    // (https://developers.circle.com/stablecoins/usdc-on-test-networks).
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    // Canonical WETH on Base Sepolia (Base predeploy/bridge WETH9).
    // Override via UNISWAP_TOKEN_WETH_84532 if your route needs a different one.
    WETH: "0x4200000000000000000000000000000000000006",
  },
  // Ethereum Sepolia (chainId 11155111)
  11155111: {
    // Circle official testnet USDC for Ethereum Sepolia
    // (https://developers.circle.com/stablecoins/usdc-on-test-networks).
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    // Canonical WETH9 on Ethereum Sepolia (widely used testnet WETH).
    // Override via UNISWAP_TOKEN_WETH_11155111 if needed.
    WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  },
} as const;

/** Resolved runtime config for the Trading API client. */
export interface UniswapConfig {
  /** Base URL (env override > constant default). */
  baseUrl: string;
  /** API key from `UNISWAP_API_KEY`, or undefined (live calls then throw). */
  apiKey: string | undefined;
  /** Resolved default swap chain (from UNISWAP_SWAP_CHAIN_ID or the default). */
  swapChainId: number;
  /** The SupportedChain entry for `swapChainId`. */
  swapChain: SupportedChain;
}

/**
 * Resolve the default swap chain id from the environment.
 * Throws if the configured id is not in SUPPORTED_CHAINS (so we never silently
 * send requests to a chain the API doesn't support).
 */
export function resolveSwapChainId(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env[ENV.swapChainId]?.trim();
  if (!raw) return DEFAULT_SWAP_CHAIN_ID;
  const id = Number(raw);
  if (!Number.isInteger(id)) {
    throw new Error(
      `Invalid ${ENV.swapChainId}="${raw}". Expected an integer chain id.`,
    );
  }
  if (!SUPPORTED_CHAINS[id]) {
    throw new Error(
      `${ENV.swapChainId}=${id} is not in the Uniswap-supported chain list. ` +
        `Supported: ${Object.keys(SUPPORTED_CHAINS).join(", ")}.`,
    );
  }
  return id;
}

/** Build the env var name for a per-token address override on a chain. */
export function tokenOverrideEnv(symbol: TokenSymbol, chainId: number): string {
  return `UNISWAP_TOKEN_${symbol}_${chainId}`;
}

/**
 * Resolve a well-known token address for a chain.
 * Order: env override (`UNISWAP_TOKEN_<SYMBOL>_<chainId>`) > TOKEN_ADDRESSES map.
 * Returns undefined if neither is set — callers should pass an explicit address.
 */
export function getTokenAddress(
  symbol: TokenSymbol,
  chainId: number,
  env: NodeJS.ProcessEnv = process.env,
): `0x${string}` | undefined {
  const override = env[tokenOverrideEnv(symbol, chainId)]?.trim();
  if (override) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(override)) {
      throw new Error(
        `${tokenOverrideEnv(symbol, chainId)}="${override}" is not a 20-byte 0x address.`,
      );
    }
    return override as `0x${string}`;
  }
  return TOKEN_ADDRESSES[chainId]?.[symbol];
}

/**
 * Load the Trading API config from the environment (or an explicit env object
 * for tests). A missing `UNISWAP_API_KEY` is allowed here (unit tests / dry
 * config) — live calls in TradingApiClient throw a clear error when it's absent.
 */
export function loadUniswapConfig(
  env: NodeJS.ProcessEnv = process.env,
): UniswapConfig {
  const swapChainId = resolveSwapChainId(env);
  const swapChain = SUPPORTED_CHAINS[swapChainId]!;
  return {
    baseUrl: env[ENV.baseUrl]?.trim() || UNISWAP_BASE_URL,
    apiKey: env[ENV.apiKey]?.trim() || undefined,
    swapChainId,
    swapChain,
  };
}

/** Like loadUniswapConfig but throws if UNISWAP_API_KEY is missing (live calls). */
export function requireApiKey(config: UniswapConfig): string {
  if (!config.apiKey) {
    throw new Error(
      `${ENV.apiKey} is not set — required for live Uniswap Trading API calls.`,
    );
  }
  return config.apiKey;
}
