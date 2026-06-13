/**
 * Client-safe configuration for the ERC-8004 reputation ranking API
 * (services/reputation). The base URL is the ONLY thing that varies between
 * environments and it comes entirely from NEXT_PUBLIC_REPUTATION_URL.
 *
 * RULES: ZERO hard-coded secrets. The reputation service itself owns the REAL
 * registry addresses / topic0 / BigQuery dataset ids (verified against the
 * erc8004-bigquery skill) and decides live-vs-fixture mode based on whether
 * GOOGLE_APPLICATION_CREDENTIALS + GCP_PROJECT_ID are present. The web app never
 * embeds any of those values — it simply reads whatever the API returns and
 * surfaces the `source: "live" | "fixture"` provenance flag verbatim.
 */

/** Default local port matches REPUTATION_PORT's default (3402). */
const DEFAULT_REPUTATION_URL = 'http://localhost:3402';

/**
 * Base URL of the reputation ranking API. Sourced from
 * NEXT_PUBLIC_REPUTATION_URL; falls back to the documented local default.
 * Trailing slashes are stripped so endpoint joins are predictable.
 */
export const REPUTATION_API_URL: string = (
  process.env.NEXT_PUBLIC_REPUTATION_URL?.trim() || DEFAULT_REPUTATION_URL
).replace(/\/+$/, '');

/** Build an absolute URL for a reputation API path (path must start with `/`). */
export function reputationUrl(path: string): string {
  return `${REPUTATION_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
