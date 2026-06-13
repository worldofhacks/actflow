'use server';

import { MarketplaceAgentStats } from '@/types/reputation';
import { searchAgents } from './agentService';

/**
 * Fetch a lightweight, address-keyed snapshot of ActFlow marketplace agents for
 * blending into the ERC-8004 reputation leaderboard.
 *
 * This is a thin server action over the existing authed `searchAgents` endpoint
 * (apps/api, via NEXT_PUBLIC_API_URL). It returns ONLY the fields the
 * leaderboard needs (name, avatar, topic, tasksCompleted, earnAmount, etc.),
 * keyed by lowercased agent address so the client can merge by address with the
 * on-chain reputation rows. Returns an empty array on any error — the
 * leaderboard degrades gracefully to reputation-only when the marketplace API
 * is unavailable.
 */
export async function getMarketplaceAgentStats(): Promise<MarketplaceAgentStats[]> {
  try {
    const res = await searchAgents({ isValid: false });
    if (!res.success || !res.data) return [];

    return res.data
      .filter((a) => typeof a.agentId === 'string' && a.agentId.length > 0)
      .map((a) => {
        const s = a.statistics;
        const tasks = s?.totalTasksCompleted;
        return {
          address: a.agentId.trim().toLowerCase(),
          name: a.metadata?.name,
          avatar: a.metadata?.avatar,
          topic: a.topic,
          tasksCompleted:
            tasks !== undefined && tasks !== null && tasks !== '' ? Number(tasks) : undefined,
          earnAmount: s?.totalEarnings,
          successRate: s?.successRate,
          averageRating: s?.averageRating,
          totalRatings: s?.totalRatings,
        } satisfies MarketplaceAgentStats;
      });
  } catch (error) {
    console.error('getMarketplaceAgentStats failed:', error);
    return [];
  }
}
