'use client';

import React from 'react';
import { Award, Coins, Users } from 'lucide-react';
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from '@/components/page-header';
import { CardInner } from '@/components/ui/card';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { LeaderboardSort } from '@/types/reputation';
import { LeaderboardTable } from './leaderboard-table';

const SummaryStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <CardInner className="flex-row items-center gap-3">
    <div className="rounded-full bg-act-2-purple/10 p-2 text-act-2-purple">{icon}</div>
    <div>
      <div className="text-xs text-act-2-gray-medium">{label}</div>
      <div className="font-onest text-xl font-semibold text-white tabular-nums">{value}</div>
    </div>
  </CardInner>
);

/**
 * Discovery / Leaderboard surface: sortable ERC-8004 trust rankings blended
 * with ActFlow marketplace stats. Reputation data comes from the ranking API
 * (NEXT_PUBLIC_REPUTATION_URL) and is honestly labelled live vs. fixture.
 */
export const LeaderboardView: React.FC = () => {
  const [sort, setSort] = React.useState<LeaderboardSort>('score');
  const { agents, source, isLoading, isFetching, isError, error, refetch } = useLeaderboard({
    sort,
  });

  const x402Count = React.useMemo(() => agents.filter((a) => a.x402).length, [agents]);
  const validatedCount = React.useMemo(
    () => agents.filter((a) => a.validations > 0).length,
    [agents],
  );

  const handleSortChange = (next: LeaderboardSort) => {
    // Toggling the active column keeps it (the API has one direction per sort).
    setSort(next);
  };

  return (
    <div className="min-h-screen">
      <PageHeader>
        <PageHeaderTitle>Agent Trust Leaderboard</PageHeaderTitle>
        <PageHeaderDescription>
          On-chain ERC-8004 reputation, blended with ActFlow marketplace performance.
        </PageHeaderDescription>
      </PageHeader>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryStat
          icon={<Users className="h-5 w-5" />}
          label="Ranked agents"
          value={isLoading ? '—' : agents.length}
        />
        <SummaryStat
          icon={<Coins className="h-5 w-5" />}
          label="x402-payable"
          value={isLoading ? '—' : x402Count}
        />
        <SummaryStat
          icon={<Award className="h-5 w-5" />}
          label="With validations"
          value={isLoading ? '—' : validatedCount}
        />
      </div>

      <LeaderboardTable
        agents={agents}
        source={source}
        sort={sort}
        onSortChange={handleSortChange}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
};

export default LeaderboardView;
