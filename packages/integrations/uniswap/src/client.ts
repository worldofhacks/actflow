/**
 * TradingApiClient — thin typed wrappers over the Uniswap Trading API
 * POST /quote, /check_approval, /swap endpoints.
 *
 * Auth: every request sends the `x-api-key` header (SKILL "Setup & Auth").
 * Request/response field names come straight from ./types (verbatim from the
 * uniswap-api SKILL). The client builds the request bodies with EXACTLY those
 * field names — assembly is split into pure helpers so unit tests can assert
 * the bodies without any network access.
 *
 * The API key is NEVER hard-coded — it comes from the resolved UniswapConfig
 * (env `UNISWAP_API_KEY`). Live calls throw a clear error if it's absent.
 */
import {
  loadUniswapConfig,
  requireApiKey,
  UNISWAP_API_KEY_HEADER,
  type UniswapConfig,
} from "./config.js";
import type {
  CheckApprovalRequest,
  CheckApprovalResponse,
  QuoteRequest,
  QuoteResponse,
  SwapRequest,
  SwapResponse,
  UniswapApiError,
} from "./types.js";

/** Params for assembling a /quote request body (pure, testable). */
export interface BuildQuoteBodyParams {
  type: QuoteRequest["type"];
  /** base-units string (SKILL gotcha: always a string in base units). */
  amount: string;
  tokenIn: string;
  tokenOut: string;
  swapper: string;
  /** Defaults both tokenInChainId and tokenOutChainId. */
  chainId: number;
  /** Override the input-token chain (cross-chain); defaults to chainId. */
  tokenInChainId?: number;
  /** Override the output-token chain (cross-chain); defaults to chainId. */
  tokenOutChainId?: number;
  slippageTolerance?: number;
  routingPreference?: QuoteRequest["routingPreference"];
  permitAmount?: string;
  recipient?: string;
  protocols?: string[];
  /** Any other SKILL-listed optional /quote fields. */
  extra?: Partial<QuoteRequest>;
}

/** Params for assembling a /check_approval request body (pure, testable). */
export interface BuildCheckApprovalBodyParams {
  walletAddress: string;
  token: string;
  /** base-units string. */
  amount: string;
  chainId: number;
  tokenOut?: string;
  tokenOutChainId?: number;
  includeGasInfo?: boolean;
  urgency?: string;
}

/**
 * Assemble the POST /quote body with the EXACT SKILL field names.
 * Required: type, amount, tokenInChainId, tokenOutChainId, tokenIn, tokenOut,
 * swapper. Optionals are only included when provided.
 */
export function buildQuoteBody(p: BuildQuoteBodyParams): QuoteRequest {
  const body: QuoteRequest = {
    type: p.type,
    amount: p.amount,
    tokenInChainId: p.tokenInChainId ?? p.chainId,
    tokenOutChainId: p.tokenOutChainId ?? p.chainId,
    tokenIn: p.tokenIn,
    tokenOut: p.tokenOut,
    swapper: p.swapper,
  };
  if (p.slippageTolerance !== undefined)
    body.slippageTolerance = p.slippageTolerance;
  if (p.routingPreference !== undefined)
    body.routingPreference = p.routingPreference;
  if (p.permitAmount !== undefined) body.permitAmount = p.permitAmount;
  if (p.recipient !== undefined) body.recipient = p.recipient;
  if (p.protocols !== undefined) body.protocols = p.protocols;
  return { ...body, ...(p.extra ?? {}) };
}

/**
 * Assemble the POST /check_approval body with the EXACT SKILL field names.
 * Required: chainId, walletAddress, token, amount. Optionals when provided.
 */
export function buildCheckApprovalBody(
  p: BuildCheckApprovalBodyParams,
): CheckApprovalRequest {
  const body: CheckApprovalRequest = {
    chainId: p.chainId,
    walletAddress: p.walletAddress,
    token: p.token,
    amount: p.amount,
  };
  if (p.tokenOut !== undefined) body.tokenOut = p.tokenOut;
  if (p.tokenOutChainId !== undefined) body.tokenOutChainId = p.tokenOutChainId;
  if (p.includeGasInfo !== undefined) body.includeGasInfo = p.includeGasInfo;
  if (p.urgency !== undefined) body.urgency = p.urgency;
  return body;
}

/** Assemble the POST /swap body. Required: `quote`. Optionals when provided. */
export function buildSwapBody(
  quote: QuoteResponse,
  opts: Omit<SwapRequest, "quote"> = {},
): SwapRequest {
  const body: SwapRequest = { quote: quote.quote };
  if (opts.signature !== undefined) body.signature = opts.signature;
  // permitData defaults to whatever /quote returned (SKILL: pass both
  // permitData and signature to /swap when a permit is required).
  const permitData =
    opts.permitData !== undefined ? opts.permitData : quote.permitData;
  if (permitData) body.permitData = permitData;
  if (opts.includeGasInfo !== undefined)
    body.includeGasInfo = opts.includeGasInfo;
  if (opts.refreshGasPrice !== undefined)
    body.refreshGasPrice = opts.refreshGasPrice;
  if (opts.simulateTransaction !== undefined)
    body.simulateTransaction = opts.simulateTransaction;
  if (opts.safetyMode !== undefined) body.safetyMode = opts.safetyMode;
  if (opts.deadline !== undefined) body.deadline = opts.deadline;
  if (opts.urgency !== undefined) body.urgency = opts.urgency;
  return body;
}

/** Error thrown for non-2xx Trading API responses (carries status + body). */
export class TradingApiHttpError extends Error {
  readonly status: number;
  readonly path: string;
  readonly body: UniswapApiError | string | undefined;
  constructor(
    path: string,
    status: number,
    body: UniswapApiError | string | undefined,
  ) {
    const detail =
      typeof body === "string" ? body : body?.message || body?.error || "";
    super(`Uniswap ${path} ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "TradingApiHttpError";
    this.status = status;
    this.path = path;
    this.body = body;
  }
}

export interface TradingApiClientOptions {
  /** Resolved config (env-driven). Defaults to loadUniswapConfig(). */
  config?: UniswapConfig;
  /** Per-request network timeout (ms). Default 15000. */
  requestTimeoutMs?: number;
  /** Retries on 429/500/503 (SKILL: implement backoff). Default 2. */
  maxRetries?: number;
  /** Base backoff (ms) between retries. Default 500. */
  retryBaseMs?: number;
  /** Injectable fetch (for tests). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

const RETRYABLE_STATUS = new Set([429, 500, 503]);

/** Typed client over the three core Trading API endpoints. */
export class TradingApiClient {
  readonly config: UniswapConfig;
  private readonly requestTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TradingApiClientOptions = {}) {
    this.config = options.config ?? loadUniswapConfig();
    this.requestTimeoutMs = options.requestTimeoutMs ?? 15_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBaseMs = options.retryBaseMs ?? 500;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error(
        "No fetch implementation available — pass fetchImpl or run on Node >=18.",
      );
    }
  }

  /** Auth + content headers for every request (SKILL "Setup & Auth"). */
  private headers(): Record<string, string> {
    return {
      [UNISWAP_API_KEY_HEADER]: requireApiKey(this.config),
      accept: "application/json",
      "content-type": "application/json",
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        this.requestTimeoutMs,
      );
      try {
        const res = await this.fetchImpl(url, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = text ? JSON.parse(text) : undefined;
        } catch {
          parsed = text;
        }
        if (!res.ok) {
          if (RETRYABLE_STATUS.has(res.status) && attempt < this.maxRetries) {
            await this.backoff(attempt);
            continue;
          }
          throw new TradingApiHttpError(
            path,
            res.status,
            parsed as UniswapApiError | string,
          );
        }
        return parsed as T;
      } catch (err) {
        // Network/abort errors are retryable too.
        if (err instanceof TradingApiHttpError) throw err;
        lastErr = err;
        if (attempt < this.maxRetries) {
          await this.backoff(attempt);
          continue;
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error(`Uniswap ${path} failed: ${String(lastErr)}`);
  }

  private backoff(attempt: number): Promise<void> {
    const ms = this.retryBaseMs * 2 ** attempt;
    return new Promise((r) => setTimeout(r, ms));
  }

  /** POST /quote — "Generate a quote for a token swap". */
  getQuote(params: BuildQuoteBodyParams | QuoteRequest): Promise<QuoteResponse> {
    const body = isQuoteRequest(params) ? params : buildQuoteBody(params);
    return this.post<QuoteResponse>("/quote", body);
  }

  /** POST /check_approval — "Check if token approval is required". */
  checkApproval(
    params: BuildCheckApprovalBodyParams | CheckApprovalRequest,
  ): Promise<CheckApprovalResponse> {
    const body = isCheckApprovalRequest(params)
      ? params
      : buildCheckApprovalBody(params);
    return this.post<CheckApprovalResponse>("/check_approval", body);
  }

  /**
   * POST /swap — "Convert an AMM quote into an unsigned transaction".
   * Accepts the full /quote response and echoes its `quote` object back, plus
   * any signature/permitData per the SKILL.
   */
  buildSwap(
    quote: QuoteResponse,
    opts: Omit<SwapRequest, "quote"> = {},
  ): Promise<SwapResponse> {
    return this.post<SwapResponse>("/swap", buildSwapBody(quote, opts));
  }
}

/** Heuristic: a fully-formed QuoteRequest already has the required keys. */
function isQuoteRequest(
  p: BuildQuoteBodyParams | QuoteRequest,
): p is QuoteRequest {
  return (
    "tokenInChainId" in p &&
    "tokenOutChainId" in p &&
    (p as QuoteRequest).tokenInChainId !== undefined
  );
}

function isCheckApprovalRequest(
  p: BuildCheckApprovalBodyParams | CheckApprovalRequest,
): p is CheckApprovalRequest {
  // Both shapes share the same required keys, so either is a valid body.
  return "chainId" in p && "walletAddress" in p && "token" in p;
}
