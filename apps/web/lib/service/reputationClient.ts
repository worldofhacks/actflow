/**
 * Browser-side client for the ERC-8004 reputation ranking API
 * (services/reputation). Plain `fetch` against NEXT_PUBLIC_REPUTATION_URL — the
 * service has CORS enabled and responds fast from fixtures, so no auth and no
 * heavy client is needed. Every helper preserves the `source` provenance flag.
 */

import { reputationUrl } from '@/lib/config/reputation';
import {
  AgentReputationResponse,
  LeaderboardResponse,
  LeaderboardSort,
  ReputationHealthResponse,
} from '@/types/reputation';

const DEFAULT_LIMIT = 50;

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(reputationUrl(path), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
    // Always hit the live service; the service itself caches BigQuery results.
    cache: 'no-store',
  });

  if (!res.ok) {
    // Surface the API's structured error message when present.
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      /* non-JSON error body — keep the status code */
    }
    throw new Error(detail);
  }

  return (await res.json()) as T;
}

/** GET /leaderboard?sort=&limit= */
export async function fetchLeaderboard(
  params: { sort?: LeaderboardSort; limit?: number } = {},
  signal?: AbortSignal,
): Promise<LeaderboardResponse> {
  const sort = params.sort ?? 'score';
  const limit = params.limit ?? DEFAULT_LIMIT;
  const qs = new URLSearchParams({ sort, limit: String(limit) });
  return getJson<LeaderboardResponse>(`/leaderboard?${qs.toString()}`, signal);
}

/** GET /agents/:address/reputation (address = owner 0x-addr OR erc8004 tokenId). */
export async function fetchAgentReputation(
  address: string,
  signal?: AbortSignal,
): Promise<AgentReputationResponse> {
  return getJson<AgentReputationResponse>(
    `/agents/${encodeURIComponent(address)}/reputation`,
    signal,
  );
}

/** GET /health */
export async function fetchReputationHealth(
  signal?: AbortSignal,
): Promise<ReputationHealthResponse> {
  return getJson<ReputationHealthResponse>(`/health`, signal);
}
