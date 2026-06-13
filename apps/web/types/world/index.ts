/**
 * Shared types for the World ID free-trial flow.
 *
 * The backend (apps/api) owns proof verification. The frontend only forwards the
 * IDKit result payload AS-IS and renders the resulting trial state — it never
 * talks to the World API directly.
 */

/** The RpContext returned by our own /api/world/rp-context route (signed server-side). */
export interface WorldRpContext {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
}

/** Success shape of apps/api POST /world/verify. */
export interface WorldVerifyResponse {
  nullifier: string;
  freeTrialsRemaining: number;
  credited: boolean;
  apiVersion: 'v4' | 'v2';
}

/** Success shape of apps/api GET /world/trials. */
export interface WorldTrialsResponse {
  nullifier: string | null;
  freeTrialsRemaining: number;
}

/** Success shape of apps/api POST /world/consume-trial. */
export interface WorldConsumeTrialResponse {
  consumed: boolean;
  paymentRequired: boolean;
  freeTrialsRemaining: number;
  nullifier: string;
}

/** Error shape returned by the backend for any World endpoint. */
export interface WorldErrorResponse {
  message: string;
  code: string;
}

/**
 * Backend error codes we branch on. The trial-already-used codes arrive with
 * HTTP 403; invalid proofs with 400; network/verification failures with 502.
 */
export type WorldErrorCode =
  | 'invalid_proof'
  | 'already_verified'
  | 'exceeded_max_verifications'
  | 'verification_error'
  | (string & {});

/** Treated as "this human already used their free trial". */
export const TRIAL_ALREADY_USED_CODES = [
  'already_verified',
  'exceeded_max_verifications',
] as const;

export function isTrialAlreadyUsed(code: string | undefined): boolean {
  return !!code && (TRIAL_ALREADY_USED_CODES as readonly string[]).includes(code);
}
