/**
 * Service configuration, entirely from environment variables. ZERO hard-coded
 * secrets. AUTO mode selection: live BigQuery only when BOTH
 * GOOGLE_APPLICATION_CREDENTIALS and GCP_PROJECT_ID are present and non-empty
 * (per the skill's ADC auth requirement); otherwise fixture mode.
 */

export interface ReputationConfig {
  /** HTTP port (REPUTATION_PORT, default 3402). */
  port: number;
  /** Bind host (REPUTATION_HOST, default 0.0.0.0). */
  host: string;
  /** Resolved data source mode. */
  mode: 'live' | 'fixture';
  /** GCP billing project id (queries bill here; data is public). */
  gcpProjectId: string | null;
  /** Path to service-account JSON (ADC). Presence-checked only. */
  googleAppCredentials: string | null;
  /** BigQuery result cache TTL in ms (REPUTATION_CACHE_TTL_MS, default 60000). */
  cacheTtlMs: number;
  /** CORS allowed origins (REPUTATION_CORS_ORIGIN, comma-separated, default *). */
  corsOrigin: string | string[] | boolean;
  /**
   * Half-life in days for recency weighting (REPUTATION_RECENCY_HALFLIFE_DAYS,
   * default 30). Config-driven so reviewers can tune without a code change.
   */
  recencyHalfLifeDays: number;
  /** Sparkline bucket count (REPUTATION_SPARKLINE_BUCKETS, default 14 days). */
  sparklineBuckets: number;
}

function nonEmpty(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function intEnv(name: string, fallback: number): number {
  const raw = nonEmpty(process.env[name]);
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function floatEnv(name: string, fallback: number): number {
  const raw = nonEmpty(process.env[name]);
  if (raw === null) return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseCors(): string | string[] | boolean {
  const raw = nonEmpty(process.env.REPUTATION_CORS_ORIGIN);
  if (raw === null || raw === '*') return true; // reflect any origin
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length === 1 ? parts[0] : parts;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ReputationConfig {
  const gcpProjectId = nonEmpty(env.GCP_PROJECT_ID);
  const googleAppCredentials = nonEmpty(env.GOOGLE_APPLICATION_CREDENTIALS);
  const mode: 'live' | 'fixture' =
    gcpProjectId && googleAppCredentials ? 'live' : 'fixture';

  return {
    port: intEnv('REPUTATION_PORT', 3402),
    host: nonEmpty(env.REPUTATION_HOST) ?? '0.0.0.0',
    mode,
    gcpProjectId,
    googleAppCredentials,
    cacheTtlMs: intEnv('REPUTATION_CACHE_TTL_MS', 60_000),
    corsOrigin: parseCors(),
    recencyHalfLifeDays: floatEnv('REPUTATION_RECENCY_HALFLIFE_DAYS', 30),
    sparklineBuckets: intEnv('REPUTATION_SPARKLINE_BUCKETS', 14),
  };
}
