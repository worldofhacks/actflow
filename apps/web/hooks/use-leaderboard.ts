'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchLeaderboard } from '@/lib/service/reputationClient';
import { getMarketplaceAgentStats } from '@/lib/service/leaderboardService';
import {
  BlendedAgent,
  DataSource,
  LeaderboardSort,
  MarketplaceAgentStats,
} from '@/types/reputation';

const LEADERBOARD_STALE_MS = 30_000;
const MARKETPLACE_STALE_MS = 60_000;

export interface UseLeaderboardResult {
  /** Reputation rows blended with ActFlow marketplace stats (by address). */
  agents: BlendedAgent[];
  /** Provenance of the on-chain reputation data ("live" | "fixture"). */
  source: DataSource | null;
  /** Sort the API echoed back. */
  sort: LeaderboardSort | null;
  isLoading: boolean;
  /** True while a background refetch (e.g. sort change) is in flight. */
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  /** Re-run both queries. */
  refetch: () => void;
}

/**
 * Load the ERC-8004 trust leaderboard and blend each row with ActFlow's own
 * marketplace AgentStatistics (tasksCompleted, earnAmount, ...), merged by
 * lowercased address. Reputation is the source of truth for ranking/score;
 * marketplace stats are decorative and degrade to null when unavailable.
 */
export function useLeaderboard(params: {
  sort: LeaderboardSort;
  limit?: number;
}): UseLeaderboardResult {
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', params.sort, params.limit ?? null],
    queryFn: ({ signal }) =>
      fetchLeaderboard({ sort: params.sort, limit: params.limit }, signal),
    staleTime: LEADERBOARD_STALE_MS,
    // Keep showing the previous (sorted) list while re-sorting.
    placeholderData: (prev) => prev,
    retry: 1,
  });

  // Marketplace stats are independent of sort — fetch once and reuse.
  const marketplaceQuery = useQuery({
    queryKey: ['marketplace-agent-stats'],
    queryFn: () => getMarketplaceAgentStats(),
    staleTime: MARKETPLACE_STALE_MS,
    retry: 1,
  });

  const statsByAddress = useMemo(() => {
    const map = new Map<string, MarketplaceAgentStats>();
    for (const s of marketplaceQuery.data ?? []) {
      if (s.address) map.set(s.address.toLowerCase(), s);
    }
    return map;
  }, [marketplaceQuery.data]);

  const agents = useMemo<BlendedAgent[]>(() => {
    const rows = leaderboardQuery.data?.agents ?? [];
    return rows.map((a) => ({
      ...a,
      marketplace: a.address ? (statsByAddress.get(a.address.toLowerCase()) ?? null) : null,
    }));
  }, [leaderboardQuery.data, statsByAddress]);

  return {
    agents,
    source: leaderboardQuery.data?.source ?? null,
    sort: leaderboardQuery.data?.sort ?? null,
    isLoading: leaderboardQuery.isLoading,
    isFetching: leaderboardQuery.isFetching || marketplaceQuery.isFetching,
    isError: leaderboardQuery.isError,
    error: (leaderboardQuery.error as Error) ?? null,
    refetch: () => {
      void leaderboardQuery.refetch();
      void marketplaceQuery.refetch();
    },
  };
}
