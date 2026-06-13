import { LeaderboardView } from '@/components/leaderboard/leaderboard-view';

export const metadata = {
  title: 'Agent Trust Leaderboard | ActFlow',
  description:
    'On-chain ERC-8004 agent reputation rankings blended with ActFlow marketplace performance.',
};

/**
 * Discovery / Leaderboard surface. The view is fully client-side: it streams
 * trust rankings from the reputation ranking API (NEXT_PUBLIC_REPUTATION_URL)
 * and blends them with ActFlow marketplace stats. Data provenance (live vs.
 * fixture) is surfaced on the page itself.
 */
export default function LeaderboardPage() {
  return <LeaderboardView />;
}
