/**
 * Pure, framework-free World ID cloud-verify helper.
 *
 * HARD REQUIREMENT (World prize): the ZK proof is verified SERVER-SIDE by POSTing the
 * IDKit result payload to the World cloud verify endpoint. The client result is never
 * trusted on its own.
 *
 * This module intentionally has NO NestJS / Mongoose imports so it can be unit-tested
 * directly (Node 22 native TS) with a mocked `fetch` and NEVER hits the live API.
 *
 * Endpoint selection (config-driven):
 *   - v4 (current): POST {host}/api/v4/verify/{rpId}     when rpId is set
 *   - v2 (fallback): POST {host}/api/v2/verify/{appId}   when rpId is unset
 *
 * Per the skill / docs: "Forward the IDKit result payload as-is. No field remapping is
 * required." We therefore forward the client payload byte-for-byte and only inject the
 * `action` (so the server, not the client, fixes which action is being verified).
 */

export type VerifyTarget = {
  apiHost: string;
  rpId?: string;
  appId?: string;
  apiKey?: string;
  /** action id the server enforces (overrides any action in the client payload) */
  action: string;
};

export type WorldVerifyResult = {
  /** The dedup key: a unique (human, app, action) identifier. */
  nullifier: string;
  /** Which endpoint answered: 'v4' or 'v2'. */
  apiVersion: 'v4' | 'v2';
  /** Raw verdict body from World (for logging / debugging). */
  raw: unknown;
};

export class WorldVerifyError extends Error {
  /** HTTP status to surface to the client (4xx). */
  readonly httpStatus: number;
  /** World error code, e.g. invalid_proof / verification_error / already_verified. */
  readonly code: string;
  /** Raw body from World. */
  readonly raw: unknown;

  constructor(message: string, code: string, httpStatus: number, raw: unknown) {
    super(message);
    this.name = 'WorldVerifyError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.raw = raw;
  }
}

/** "Trial already used" style codes -> map to 403 instead of generic 400. */
const TRIAL_USED_CODES = new Set(['exceeded_max_verifications', 'already_verified']);

function buildUrl(target: VerifyTarget): { url: string; apiVersion: 'v4' | 'v2' } {
  const host = target.apiHost.replace(/\/+$/, '');
  if (target.rpId) {
    return { url: `${host}/api/v4/verify/${target.rpId}`, apiVersion: 'v4' };
  }
  if (target.appId) {
    return { url: `${host}/api/v2/verify/${target.appId}`, apiVersion: 'v2' };
  }
  throw new WorldVerifyError(
    'World ID not configured: set WORLD_RP_ID (v4) or WORLD_APP_ID (v2)',
    'not_configured',
    500,
    null,
  );
}

/**
 * Extract the nullifier from either a v4 or a v2 verdict.
 * v4: top-level `nullifier`, or `results[].nullifier`.
 * v2: `nullifier_hash`.
 */
export function extractNullifier(verdict: any): string | undefined {
  if (!verdict || typeof verdict !== 'object') return undefined;
  if (typeof verdict.nullifier === 'string' && verdict.nullifier) return verdict.nullifier;
  if (typeof verdict.nullifier_hash === 'string' && verdict.nullifier_hash) {
    return verdict.nullifier_hash;
  }
  if (Array.isArray(verdict.results)) {
    for (const r of verdict.results) {
      if (r && typeof r.nullifier === 'string' && r.nullifier) return r.nullifier;
    }
  }
  return undefined;
}

/**
 * POST the IDKit payload to the World cloud verify endpoint and return the nullifier on
 * success. Throws WorldVerifyError on any failure (caller maps to an HTTP response).
 *
 * @param payload the IDKit result payload (forwarded as-is)
 * @param target  config-driven endpoint + auth + enforced action
 * @param fetchImpl injectable fetch (defaults to global fetch) — tests pass a mock
 */
export async function verifyWorldProof(
  payload: Record<string, unknown>,
  target: VerifyTarget,
  fetchImpl: typeof fetch = fetch,
): Promise<WorldVerifyResult> {
  const { url, apiVersion } = buildUrl(target);

  // Forward as-is; only the server-enforced action is injected/overridden.
  const body = { ...payload, action: target.action };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (target.apiKey) {
    // The exact auth header is UNVERIFIED in the skill (it documents the API key as a
    // server-only secret but not the wire header). Per the task instructions we use
    // `Authorization: Bearer`. Noted in docs/hackathon/WORLD.md.
    headers['Authorization'] = `Bearer ${target.apiKey}`;
  }

  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new WorldVerifyError(
      `Failed to reach World verify endpoint: ${(err as Error)?.message ?? err}`,
      'network_error',
      502,
      null,
    );
  }

  let verdict: any = null;
  try {
    verdict = await res.json();
  } catch {
    verdict = null;
  }

  const ok = res.ok && verdict && verdict.success === true;
  if (!ok) {
    // v4 puts a per-response code under results[]; v2 puts `code` at top level.
    const code: string =
      verdict?.code ??
      verdict?.results?.find?.((r: any) => r?.code)?.code ??
      (res.status >= 500 ? 'verification_error' : 'invalid_proof');
    const httpStatus = TRIAL_USED_CODES.has(code) ? 403 : res.status >= 500 ? 502 : 400;
    throw new WorldVerifyError(
      verdict?.detail ?? verdict?.message ?? `World verification failed: ${code}`,
      code,
      httpStatus,
      verdict,
    );
  }

  const nullifier = extractNullifier(verdict);
  if (!nullifier) {
    throw new WorldVerifyError(
      'World verification succeeded but no nullifier was returned',
      'missing_nullifier',
      502,
      verdict,
    );
  }

  return { nullifier, apiVersion, raw: verdict };
}
