/**
 * Browser-side client for the ActFlow hire / pay / receipt flow.
 *
 * The backend (apps/api `/payments/*`) owns ALL payment verification, settlement
 * and receipt persistence. This client only:
 *   - POST /payments/hire     — the single "unlock task" entry point (-> 402 or free unlock)
 *   - POST /payments/settle   — submit the signed x402 payload (real OR mock) -> receipt
 *   - GET  /payments/receipts — payment history (newest first)
 *   - GET  /payments/receipts/:id — single receipt
 *
 * It NEVER talks to Arc / Privy / World directly. Real EIP-3009 signing is done
 * by the caller's connected wallet (wagmi); this module just shapes the request.
 *
 * MOCK SAFETY: when no funded/connected wallet can sign, callers build a clearly
 * labeled mock payload (mock:true) and the `mock` flag flows through settle ->
 * receipt -> UI. We never fabricate a real tx hash or explorer link for mock.
 */
import type {
  HireRequest,
  HireResponse,
  ReceiptView,
  SettleRequest,
  SettleResponse,
} from '@/types/payments';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/** A failed /payments call, carrying the structured reason + HTTP status. */
export class PaymentApiError extends Error {
  status: number;
  reason?: string;
  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.name = 'PaymentApiError';
    this.status = status;
    this.reason = reason;
  }
}

function authHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function readError(res: Response): Promise<PaymentApiError> {
  let message = `Payment request failed (HTTP ${res.status})`;
  let reason: string | undefined;
  try {
    const body = (await res.json()) as { message?: string; reason?: string };
    if (body?.message) message = body.message;
    if (body?.reason) reason = body.reason;
  } catch {
    /* non-JSON body — keep default */
  }
  return new PaymentApiError(message, res.status, reason);
}

/**
 * POST /payments/hire — the single "unlock task" entry point.
 *
 * Returns BOTH outcomes as data (we do not throw on HTTP 402):
 *   - HTTP 402 => { status:402, challenge, settle }  (payment required)
 *   - HTTP 200 => { status:200, method:'world-trial', unlocked, receipt }
 *
 * Any other non-OK status is a real error and throws.
 */
export async function hire(
  body: HireRequest,
  opts: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<HireResponse> {
  const res = await fetch(`${API_BASE}/payments/hire`, {
    method: 'POST',
    headers: authHeaders(opts.accessToken),
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  // 402 is an expected "payment required" outcome, not an error.
  if (res.status === 402 || res.ok) {
    return (await res.json()) as HireResponse;
  }
  throw await readError(res);
}

/**
 * POST /payments/settle — verify the signed x402 payload, unlock, write receipt.
 * Returns `{ paid, unlocked, mock, txHash?, explorerUrl?, receipt? , reason? }`.
 * A failed verification (paid=false) is returned as data, not thrown.
 */
export async function settle(
  body: SettleRequest,
  opts: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<SettleResponse> {
  const res = await fetch(`${API_BASE}/payments/settle`, {
    method: 'POST',
    headers: authHeaders(opts.accessToken),
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as SettleResponse;
}

export interface ReceiptsQuery {
  payer?: string;
  agent?: string;
  limit?: number;
  offset?: number;
}

/**
 * GET /payments/receipts — payment history (newest first). At least one of
 * payer / agent (or an authenticated user) is required by the backend.
 */
export async function getReceipts(
  query: ReceiptsQuery,
  opts: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<ReceiptView[]> {
  const params = new URLSearchParams();
  if (query.payer) params.set('payer', query.payer);
  if (query.agent) params.set('agent', query.agent);
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.offset != null) params.set('offset', String(query.offset));
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/payments/receipts${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: authHeaders(opts.accessToken),
    cache: 'no-store',
    signal: opts.signal,
  });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as ReceiptView[];
}

/** GET /payments/receipts/:id — single receipt (404 -> PaymentApiError). */
export async function getReceipt(
  id: string,
  opts: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<ReceiptView> {
  const res = await fetch(`${API_BASE}/payments/receipts/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: authHeaders(opts.accessToken),
    cache: 'no-store',
    signal: opts.signal,
  });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as ReceiptView;
}
