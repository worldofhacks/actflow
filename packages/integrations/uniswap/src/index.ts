/**
 * @actflow/integrations-uniswap — Uniswap Developer Platform Trading API for
 * ActFlow agents.
 *
 * Typed wrappers over POST /quote, /check_approval, /swap (TradingApiClient) +
 * a full viem execution path (executeSwap). NO hard-coded API keys, token
 * addresses, or chain IDs — the key comes from env UNISWAP_API_KEY, the chain
 * from env UNISWAP_SWAP_CHAIN_ID, and token addresses from a clearly-labeled,
 * overridable config map. Field names follow the uniswap-api SKILL verbatim.
 */

// config
export {
  loadUniswapConfig,
  requireApiKey,
  resolveSwapChainId,
  getTokenAddress,
  tokenOverrideEnv,
  UNISWAP_BASE_URL,
  UNISWAP_API_KEY_HEADER,
  NATIVE_TOKEN_SENTINEL,
  DEFAULT_SWAP_CHAIN_ID,
  SUPPORTED_CHAINS,
  TOKEN_ADDRESSES,
  ENV,
  type UniswapConfig,
  type SupportedChain,
  type TokenSymbol,
} from "./config.js";

// API types (verbatim field names from the SKILL)
export {
  CLASSIC_FAMILY_ROUTINGS,
  ORDER_FAMILY_ROUTINGS,
  type TradeType,
  type RoutingPreference,
  type Routing,
  type QuoteRequest,
  type QuoteResponse,
  type QuoteAmount,
  type ClassicQuote,
  type PermitData,
  type CheckApprovalRequest,
  type CheckApprovalResponse,
  type SwapRequest,
  type SwapResponse,
  type TransactionRequest,
  type UniswapApiError,
} from "./types.js";

// client + pure body assembly
export {
  TradingApiClient,
  TradingApiHttpError,
  buildQuoteBody,
  buildCheckApprovalBody,
  buildSwapBody,
  type TradingApiClientOptions,
  type BuildQuoteBodyParams,
  type BuildCheckApprovalBodyParams,
} from "./client.js";

// viem execution path
export {
  executeSwap,
  type ExecuteSwapParams,
  type ExecuteSwapResult,
} from "./execute.js";
