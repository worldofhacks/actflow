/**
 * Browser-side client for the ActFlow World ID free-trial flow.
 *
 * Two backends are involved:
 *   1. apps/web  — our own Next.js route `/api/world/rp-context` signs the proof
 *      request with the server-only RP signing key (secret never leaves the server).
 *   2. apps/api  — `/world/verify`, `/world/trials`, `/world/consume-trial` own all
 *      proof verification and trial accounting. The frontend forwards the IDKit
 *      result payload AS-IS (no field remapping) and renders the result.
 *
 * The frontend NEVER calls the live World API directly.
 */

import type {
  WorldConsumeTrialResponse,
  WorldRpContext,
  WorldTrialsResponse,
  WorldVerifyResponse,
} from '@/types/world';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/** A failed backend call, carrying the structured `{ message, code }` + HTTP status. */
export class WorldApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'WorldApiError';
    this.code = code;
    this.status = status;
  }
}

function authHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function parseError(res: Response): Promise<WorldApiError> {
  let message = `Request failed (HTTP ${res.status})`;
  let code = 'unknown_error';
  try {
    const body = (await res.json()) as { message?: string; code?: string };
    if (body?.message) message = body.message;
    if (body?.code) code = body.code;
  } catch {
    /* non-JSON error body — keep defaults */
  }
  return new WorldApiError(message, code, res.status);
}

/**
 * Fetch a freshly-signed RpContext from our own Next.js server route.
 * (Signing uses the server-only WORLD_SIGNER_KEY — never exposed to the client.)
 */
export async function fetchRpContext(signal?: AbortSignal): Promise<WorldRpContext> {
  const res = await fetch('/api/world/rp-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal,
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as WorldRpContext;
}

/**
 * Forward the IDKit result payload AS-IS to apps/api for server-side verification.
 * Wrapped as `{ payload, action }` per the backend contract; `action` defaults
 * server-side when omitted but we pass the configured one for clarity.
 */
export async function verifyProof(
  payload: unknown,
  opts: { accessToken?: string; action?: string; signal?: AbortSignal } = {},
): Promise<WorldVerifyResponse> {
  const res = await fetch(`${API_BASE}/world/verify`, {
    method: 'POST',
    headers: authHeaders(opts.accessToken),
    body: JSON.stringify({ payload, ...(opts.action ? { action: opts.action } : {}) }),
    signal: opts.signal,
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as WorldVerifyResponse;
}

/**
 * Look up remaining free trials. Uses the JWT-linked user when authenticated,
 * otherwise falls back to the explicit nullifier.
 */
export async function getTrials(
  opts: { nullifier?: string | null; accessToken?: string; signal?: AbortSignal } = {},
): Promise<WorldTrialsResponse> {
  const qs = opts.nullifier ? `?nullifier=${encodeURIComponent(opts.nullifier)}` : '';
  const res = await fetch(`${API_BASE}/world/trials${qs}`, {
    method: 'GET',
    headers: authHeaders(opts.accessToken),
    cache: 'no-store',
    signal: opts.signal,
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as WorldTrialsResponse;
}

/**
 * Consume one free trial. `consumed=true` => a free run was used;
 * `paymentRequired=true` => none left, caller should hand off to the paid flow.
 */
export async function consumeTrial(
  nullifier: string,
  opts: { accessToken?: string; action?: string; signal?: AbortSignal } = {},
): Promise<WorldConsumeTrialResponse> {
  const res = await fetch(`${API_BASE}/world/consume-trial`, {
    method: 'POST',
    headers: authHeaders(opts.accessToken),
    body: JSON.stringify({ nullifier, ...(opts.action ? { action: opts.action } : {}) }),
    signal: opts.signal,
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as WorldConsumeTrialResponse;
}
