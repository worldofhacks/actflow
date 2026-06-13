/**
 * Public World ID config read from NEXT_PUBLIC_* env (safe for the browser).
 * The widget app id and action are public; the RP signing key and verify API key
 * live ONLY on the server (apps/web route + apps/api).
 */

/** The IDKit widget app id, e.g. "app_xxxxx". */
export const WORLD_APP_ID = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}` | undefined;

/** The action id, e.g. "free-trial". */
export const WORLD_ACTION_ID = process.env.NEXT_PUBLIC_WORLD_ACTION_ID;

/**
 * IDKit environment. The simulator (simulator.worldcoin.org) produces proofs in
 * "staging"; the real World App uses "production". Defaults to production; set
 * NEXT_PUBLIC_WORLD_ENVIRONMENT=staging for simulator-based demos.
 */
export const WORLD_ENVIRONMENT =
  process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT === 'staging' ? 'staging' : 'production';

/** True only when both required public values are present. */
export function isWorldConfigured(): boolean {
  return Boolean(WORLD_APP_ID && WORLD_ACTION_ID);
}
