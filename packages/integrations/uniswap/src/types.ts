/**
 * TypeScript types for the Uniswap Trading API request/response shapes.
 *
 * Field names are taken VERBATIM from the uniswap-api SKILL.md ("Core API"
 * section), which cites the official docs + OpenAPI spec. Do not rename fields:
 * the API matches on these exact keys.
 */

/** SKILL POST /quote: `type` is `EXACT_INPUT` (or `EXACT_OUTPUT`). */
export type TradeType = "EXACT_INPUT" | "EXACT_OUTPUT";

/**
 * SKILL POST /quote: `routingPreference` active enum values: "FASTEST",
 * "BEST_PRICE".
 */
export type RoutingPreference = "FASTEST" | "BEST_PRICE";

/**
 * SKILL: `routing` enum (OpenAPI `Routing`). Classic-family (CLASSIC/WRAP/
 * UNWRAP/BRIDGE) is submitted via /swap; Dutch/priority families go to /order.
 */
export type Routing =
  | "CLASSIC"
  | "DUTCH_LIMIT"
  | "DUTCH_V2"
  | "DUTCH_V3"
  | "BRIDGE"
  | "LIMIT_ORDER"
  | "PRIORITY"
  | "WRAP"
  | "UNWRAP"
  | "CHAINED";

/** Routings that are submitted via POST /swap (you pay gas + broadcast). */
export const CLASSIC_FAMILY_ROUTINGS: readonly Routing[] = [
  "CLASSIC",
  "WRAP",
  "UNWRAP",
  "BRIDGE",
] as const;

/** Routings that are submitted via POST /order (gasless UniswapX). */
export const ORDER_FAMILY_ROUTINGS: readonly Routing[] = [
  "DUTCH_LIMIT",
  "DUTCH_V2",
  "DUTCH_V3",
  "PRIORITY",
  "LIMIT_ORDER",
] as const;

// ---------------------------------------------------------------------------
// POST /quote
// ---------------------------------------------------------------------------

/**
 * SKILL POST /quote request fields.
 * Required: `type`, `amount`, `tokenInChainId`, `tokenOutChainId`, `tokenIn`,
 * `tokenOut`, `swapper`. Optional fields listed by the SKILL are included.
 * NOTE: `amount` is always a STRING in base units (SKILL gotcha).
 */
export interface QuoteRequest {
  type: TradeType;
  amount: string;
  tokenInChainId: number;
  tokenOutChainId: number;
  tokenIn: string;
  tokenOut: string;
  swapper: string;
  // Optional (SKILL):
  generatePermitAsTransaction?: boolean;
  autoSlippage?: string;
  /** SKILL: `slippageTolerance: 0.5` means 0.5% (number, not bips). */
  slippageTolerance?: number;
  routingPreference?: RoutingPreference;
  protocols?: string[];
  hooksOptions?: unknown;
  spreadOptimization?: string;
  urgency?: string;
  /** SKILL doc example: `permitAmount: "FULL"`. */
  permitAmount?: string;
  recipient?: string;
  integratorFees?: unknown;
  walletExecutionContext?: unknown;
}

/** SKILL ClassicQuote.input / .output sub-objects. */
export interface QuoteAmount {
  amount: string;
  token: string;
  /** present on input as `maximumAmount`, on output as `minimumAmount` */
  maximumAmount?: string;
  minimumAmount?: string;
  recipient?: string;
}

/**
 * SKILL `quote` (ClassicQuote) fields. Typed loosely for forward-compat — the
 * fields actually consumed by execution (chainId, input/output) are explicit;
 * the rest are passed straight back to /swap unchanged.
 */
export interface ClassicQuote {
  chainId: number;
  input?: QuoteAmount;
  output?: QuoteAmount;
  swapper?: string;
  route?: unknown;
  slippage?: number;
  tradeType?: TradeType;
  quoteId?: string;
  gasFeeUSD?: string;
  gasFeeQuote?: string;
  gasUseEstimate?: string;
  gasPrice?: string;
  priceImpact?: number;
  txFailureReasons?: string[];
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  gasFee?: string;
  routeString?: string;
  blockNumber?: string;
  aggregatedOutputs?: unknown;
  portionAmount?: string;
  portionBips?: number;
  portionRecipient?: string;
  swapSteps?: unknown;
  // Allow extra fields the API may return without dropping them.
  [key: string]: unknown;
}

/**
 * SKILL `permitData` (OpenAPI schema name `Permit`, nullable).
 * Spec example: `types` = `{ PermitSingle, PermitDetails }`, `values` =
 * `{ details: {...}, spender, sigDeadline }`, `domain` =
 * `{ name: "Permit2", chainId, verifyingContract }`.
 * Sign as EIP-712 typed data (primaryType "PermitSingle") before /swap.
 */
export interface PermitData {
  domain: Record<string, unknown>;
  types: Record<string, Array<{ name: string; type: string }>>;
  values: Record<string, unknown>;
}

/** SKILL POST /quote response top-level fields. */
export interface QuoteResponse {
  requestId: string;
  routing: Routing;
  quote: ClassicQuote;
  permitData?: PermitData | null;
  permitTransaction?: TransactionRequest | null;
  permitGasFee?: string;
  sponsorshipInfo?: unknown;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// POST /check_approval
// ---------------------------------------------------------------------------

/**
 * SKILL POST /check_approval request fields.
 * Required: `chainId` (default 1), `walletAddress`, `token` (ERC20 address),
 * `amount` (base units, string). Optional: `urgency`, `includeGasInfo`,
 * `tokenOut`, `tokenOutChainId`.
 */
export interface CheckApprovalRequest {
  chainId: number;
  walletAddress: string;
  token: string;
  amount: string;
  // Optional (SKILL):
  urgency?: string;
  includeGasInfo?: boolean;
  tokenOut?: string;
  tokenOutChainId?: number;
}

/**
 * SKILL transaction object (returned by /check_approval `approval`/`cancel`,
 * /swap `swap`, /quote `permitTransaction`).
 */
export interface TransactionRequest {
  to: `0x${string}`;
  from?: `0x${string}`;
  data: `0x${string}`;
  value?: string;
  chainId?: number;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
  [key: string]: unknown;
}

/** SKILL POST /check_approval response. `approval` is null if already approved. */
export interface CheckApprovalResponse {
  requestId: string;
  approval?: TransactionRequest | null;
  cancel?: TransactionRequest | null;
  gasFee?: string;
  cancelGasFee?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// POST /swap
// ---------------------------------------------------------------------------

/**
 * SKILL POST /swap request.
 * Required: `quote` (echo the full quote object from /quote). Optional:
 * `signature`, `permitData`, `includeGasInfo`, `refreshGasPrice`,
 * `simulateTransaction`, `safetyMode`, `deadline`, `urgency`.
 */
export interface SwapRequest {
  quote: ClassicQuote;
  signature?: `0x${string}`;
  permitData?: PermitData | null;
  includeGasInfo?: boolean;
  refreshGasPrice?: boolean;
  simulateTransaction?: boolean;
  safetyMode?: string;
  deadline?: number;
  urgency?: string;
}

/** SKILL POST /swap response. `swap` is a TransactionRequest. */
export interface SwapResponse {
  requestId: string;
  swap: TransactionRequest;
  gasFee?: string;
  [key: string]: unknown;
}

/** SKILL error shape: `{ error, message, details }`. */
export interface UniswapApiError {
  error?: string;
  message?: string;
  details?: unknown;
}
