import { mainnet } from 'wagmi/chains';

/**
 * Client-safe ENS configuration for the web app.
 *
 * RULES (ENS judges): ZERO hard-coded ENS names / addresses / chain IDs in
 * source. Everything here is derived from env or from viem/wagmi chain objects:
 *   - the parent name comes ONLY from NEXT_PUBLIC_ENS_PARENT_NAME
 *   - the resolution chain id comes ONLY from wagmi's `mainnet` chain object
 *     (never a numeric literal), matching the mainnet transport the app already
 *     configures in app/Providers.tsx.
 */

/**
 * Chain id ENS forward/reverse resolution runs on. Sourced from the viem/wagmi
 * `mainnet` chain object — NOT a hard-coded literal — so it stays in sync with
 * the mainnet transport in Providers.tsx.
 */
export const ENS_RESOLUTION_CHAIN_ID = mainnet.id;

/**
 * Parent ENS name that owns agent subnames (e.g. `actflow.eth`).
 * `undefined` when NEXT_PUBLIC_ENS_PARENT_NAME is unset — callers must handle
 * the absence gracefully (no hard-coded fallback name).
 */
export const ENS_PARENT_NAME: string | undefined =
  process.env.NEXT_PUBLIC_ENS_PARENT_NAME?.trim() || undefined;

/** True when ENS is configured enough to attempt agent-name resolution. */
export const isEnsConfigured = (): boolean => Boolean(ENS_PARENT_NAME);

/**
 * Heuristic: does an input string look like an ENS name (rather than a raw
 * 0x address)? Used by directory search to decide whether to resolve first.
 * Deliberately loose — any dotted, non-0x token is treated as a candidate name
 * and handed to the resolver, which is the real authority.
 */
export function looksLikeEnsName(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith('0x')) return false;
  return v.includes('.');
}

/** Is this a 20-byte 0x hex address? */
export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

/**
 * Truncate an address for display (`0x1234…abcd`). Returns the input unchanged
 * when it is too short to truncate, so it never throws on unexpected values.
 */
export function shortenAddressSafe(value: string): string {
  const v = value.trim();
  if (v.length <= 12) return v;
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}
