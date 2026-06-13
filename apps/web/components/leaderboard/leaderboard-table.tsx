'use client';

import React from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Inbox,
  RotateCcw,
  Search,
} from 'lucide-react';
import { AgentName } from '@/components/agent/agent-name';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { shortenAddressSafe } from '@/lib/config/ens';
import { BlendedAgent, LeaderboardSort } from '@/types/reputation';
import { Sparkline } from './sparkline';
import { SourceIndicator } from './source-indicator';
import { X402Badge } from './x402-badge';
import { ScoreBreakdownPanel } from './score-breakdown';

interface LeaderboardTableProps {
  agents: BlendedAgent[];
  source: BlendedAgent['source'] | null;
  sort: LeaderboardSort;
  onSortChange: (sort: LeaderboardSort) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

const SORT_COLUMNS: { key: LeaderboardSort; label: string }[] = [
  { key: 'score', label: 'Trust score' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'validations', label: 'Validations' },
  { key: 'recent', label: 'Recent activity' },
];

function scoreColor(score: number): string {
  if (score >= 75) return 'text-act-turquoise';
  if (score >= 50) return 'text-act-2-purple-lighter';
  if (score >= 25) return 'text-act-gold';
  return 'text-act-2-gray-light';
}

/**
 * Natural-language / filter search over the blended rows. Deliberately local
 * and forgiving: matches ENS-style intent words (e.g. "x402", "validated",
 * "top") plus free-text against address / agent id / marketplace name + topic.
 * Pure client filtering — the API already returns the full ranked set.
 */
function filterAgents(agents: BlendedAgent[], query: string): BlendedAgent[] {
  const q = query.trim().toLowerCase();
  if (!q) return agents;

  const tokens = q.split(/\s+/).filter(Boolean);

  return agents.filter((a) => {
    const haystack = [
      a.address,
      String(a.erc8004Id),
      a.marketplace?.name ?? '',
      a.marketplace?.topic ?? '',
      a.agentUri ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return tokens.every((t) => {
      // Intent keywords (NL-ish filters).
      if (t === 'x402' || t === 'payable' || t === 'paid') return a.x402;
      if (t === 'validated' || t === 'validation' || t === 'validations')
        return a.validations > 0;
      if (t === 'reviewed' || t === 'feedback') return a.breakdown.feedbackCount > 0;
      if (t === 'top' || t === 'trusted' || t === 'high') return a.score >= 75;
      if (t === 'marketplace' || t === 'listed') return a.marketplace !== null;
      return haystack.includes(t);
    });
  });
}

const HeaderCell: React.FC<{
  column: { key: LeaderboardSort; label: string };
  active: boolean;
  onClick: () => void;
  className?: string;
}> = ({ column, active, onClick, className }) => (
  <TableHead className={className}>
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 transition-colors hover:text-white',
        active ? 'font-semibold text-white' : 'text-act-2-gray-light',
      )}
      aria-pressed={active}
    >
      {column.label}
      <ChevronDown
        className={cn('h-3.5 w-3.5 transition-opacity', active ? 'opacity-100' : 'opacity-30')}
      />
    </button>
  </TableHead>
);

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  agents,
  source,
  sort,
  onSortChange,
  isLoading,
  isFetching,
  isError,
  error,
  onRetry,
}) => {
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => filterAgents(agents, query), [agents, query]);

  const rowKey = (a: BlendedAgent) => `${a.erc8004Id}-${a.address || 'na'}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls: search + provenance */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-act-2-gray-medium" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents — try “x402”, “validated”, “top”, a name or 0x…"
            className="pl-11"
            aria-label="Search agents"
          />
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <span className="text-xs text-act-2-gray-medium">Updating…</span>
          )}
          <SourceIndicator source={source} />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div className="text-sm text-white">Couldn’t load the trust leaderboard.</div>
          <div className="max-w-md text-xs text-act-2-gray-medium">
            {error?.message ?? 'The reputation service is unreachable.'} The ranking API runs
            at NEXT_PUBLIC_REPUTATION_URL.
          </div>
          <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1 gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-12 text-act-2-gray-light">#</TableHead>
                <TableHead className="text-act-2-gray-light">Agent</TableHead>
                <HeaderCell
                  column={SORT_COLUMNS[0]}
                  active={sort === 'score'}
                  onClick={() => onSortChange('score')}
                  className="text-right"
                />
                <HeaderCell
                  column={SORT_COLUMNS[1]}
                  active={sort === 'feedback'}
                  onClick={() => onSortChange('feedback')}
                  className="hidden text-right md:table-cell"
                />
                <HeaderCell
                  column={SORT_COLUMNS[2]}
                  active={sort === 'validations'}
                  onClick={() => onSortChange('validations')}
                  className="hidden text-right md:table-cell"
                />
                <TableHead className="hidden text-act-2-gray-light lg:table-cell">
                  Marketplace
                </TableHead>
                <HeaderCell
                  column={SORT_COLUMNS[3]}
                  active={sort === 'recent'}
                  onClick={() => onSortChange('recent')}
                  className="hidden text-right sm:table-cell"
                />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Loading skeletons (bounded — never an infinite spinner). */}
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-white/5">
                    <TableCell>
                      <Skeleton className="h-4 w-4 bg-act-2-dark-blue-gray" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40 bg-act-2-dark-blue-gray" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-12 bg-act-2-dark-blue-gray" />
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      <Skeleton className="ml-auto h-4 w-8 bg-act-2-dark-blue-gray" />
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      <Skeleton className="ml-auto h-4 w-8 bg-act-2-dark-blue-gray" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-24 bg-act-2-dark-blue-gray" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="ml-auto h-6 w-24 bg-act-2-dark-blue-gray" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}

              {/* Empty (no rows from API). */}
              {!isLoading && agents.length === 0 && (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                      <Inbox className="h-8 w-8 text-act-2-gray-medium" />
                      <div className="text-sm text-white">No ranked agents yet.</div>
                      <div className="max-w-md text-xs text-act-2-gray-medium">
                        {source === 'fixture'
                          ? 'No sample agents are configured.'
                          : 'No ERC-8004 reputation activity has been indexed yet.'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Empty (filtered out by search). */}
              {!isLoading && agents.length > 0 && filtered.length === 0 && (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                      <Search className="h-8 w-8 text-act-2-gray-medium" />
                      <div className="text-sm text-white">
                        No agents match “{query.trim()}”.
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuery('')}
                        className="mt-1"
                      >
                        Clear search
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Rows */}
              {!isLoading &&
                filtered.map((a, i) => {
                  const key = rowKey(a);
                  const isOpen = expanded === key;
                  const hasAddress = !!a.address;
                  const profileHref = hasAddress ? `/agent/${a.address}` : undefined;
                  return (
                    <React.Fragment key={key}>
                      <TableRow
                        className="cursor-pointer border-white/5 transition-colors hover:bg-white/[0.04]"
                        data-state={isOpen ? 'selected' : undefined}
                        onClick={() => setExpanded(isOpen ? null : key)}
                      >
                        <TableCell className="font-mono text-sm text-act-2-gray-medium">
                          {i + 1}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {hasAddress ? (
                                <span onClick={(e) => e.stopPropagation()}>
                                  <AgentName
                                    address={a.address}
                                    href={profileHref}
                                    showAvatar
                                    className="text-sm text-white"
                                  />
                                </span>
                              ) : (
                                <span className="font-mono text-sm text-act-2-gray-medium">
                                  agent #{a.erc8004Id}
                                </span>
                              )}
                              <X402Badge enabled={a.x402} />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-act-2-gray-medium">
                              <span>ERC-8004 #{a.erc8004Id}</span>
                              {hasAddress && (
                                <span className="font-mono">
                                  {shortenAddressSafe(a.address)}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <span
                            className={cn(
                              'font-onest text-base font-semibold tabular-nums',
                              scoreColor(a.score),
                            )}
                          >
                            {a.score.toFixed(2)}
                          </span>
                        </TableCell>

                        <TableCell className="hidden text-right tabular-nums text-act-2-gray-light md:table-cell">
                          {a.breakdown.feedbackCount}
                        </TableCell>

                        <TableCell className="hidden text-right tabular-nums text-act-2-gray-light md:table-cell">
                          {a.validations}
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          {a.marketplace ? (
                            <div className="flex flex-col">
                              <span className="truncate text-sm text-white">
                                {a.marketplace.tasksCompleted ?? 0} tasks
                              </span>
                              <span className="truncate text-[11px] text-act-2-gray-medium">
                                {a.marketplace.earnAmount
                                  ? `${a.marketplace.earnAmount} earned`
                                  : a.marketplace.topic || 'listed'}
                              </span>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-white/10 text-[11px] text-act-2-gray-medium"
                            >
                              not listed
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="hidden text-right sm:table-cell">
                          <span className="inline-flex justify-end text-act-2-purple-light">
                            <Sparkline data={a.sparkline} />
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <ChevronRight
                            className={cn(
                              'ml-auto h-4 w-4 text-act-2-gray-medium transition-transform',
                              isOpen && 'rotate-90 text-act-2-purple',
                            )}
                          />
                        </TableCell>
                      </TableRow>

                      {isOpen && (
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableCell colSpan={8} className="bg-white/[0.02] p-4 sm:p-6">
                            <ScoreBreakdownPanel agent={a} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="text-xs text-act-2-gray-medium">
          Showing {filtered.length} of {agents.length} ranked agent
          {agents.length === 1 ? '' : 's'} · ranked by{' '}
          {SORT_COLUMNS.find((c) => c.key === sort)?.label.toLowerCase() ?? sort}
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
