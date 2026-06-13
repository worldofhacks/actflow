'use client';

import React from 'react';
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Star,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { CardInner } from '@/components/ui/card';
import { BlendedAgent } from '@/types/reputation';

interface ScoreBreakdownProps {
  agent: BlendedAgent;
}

function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return v.toFixed(digits);
}

function fmtDays(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return 'No feedback yet';
  if (v < 1) return 'today';
  return `${v.toFixed(1)} days ago`;
}

const Metric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}> = ({ icon, label, value, hint }) => (
  <CardInner className="flex-row items-center gap-3">
    <div className="rounded-full bg-act-2-purple/10 p-1.5 text-act-2-purple">{icon}</div>
    <div className="min-w-0">
      <div className="text-xs text-act-2-gray-medium">{label}</div>
      <div className="truncate text-sm font-medium text-white">{value}</div>
      {hint && <div className="truncate text-[11px] text-act-2-gray-medium">{hint}</div>}
    </div>
  </CardInner>
);

/**
 * The components behind an agent's trust score, shown when a leaderboard row is
 * expanded. Splits the on-chain ERC-8004 reputation breakdown from the blended
 * ActFlow marketplace stats so reviewers can see both sources distinctly.
 */
export const ScoreBreakdownPanel: React.FC<ScoreBreakdownProps> = ({ agent }) => {
  const b = agent.breakdown;
  const m = agent.marketplace;

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-act-2-gray-light">
          <ShieldCheck className="h-3.5 w-3.5 text-act-2-purple" />
          On-chain reputation (ERC-8004)
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            icon={<MessageSquare className="h-4 w-4" />}
            label="Feedback (non-revoked)"
            value={b.feedbackCount}
            hint={b.revokedCount > 0 ? `${b.revokedCount} revoked excluded` : undefined}
          />
          <Metric
            icon={<Star className="h-4 w-4" />}
            label="Average value"
            value={fmtNum(b.averageValue)}
            hint={`recency-weighted ${fmtNum(b.recencyWeightedValue)}`}
          />
          <Metric
            icon={<TrendingUp className="h-4 w-4" />}
            label="Recency-weighted"
            value={fmtNum(b.recencyWeightedValue)}
          />
          <Metric
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Validations"
            value={b.validationCount}
          />
          <Metric
            icon={<Activity className="h-4 w-4" />}
            label="Avg validation confidence"
            value={b.validationCount > 0 ? `${fmtNum(b.averageValidationConfidence, 1)}%` : '—'}
          />
          <Metric
            icon={<CalendarClock className="h-4 w-4" />}
            label="Last feedback"
            value={fmtDays(b.daysSinceLastFeedback)}
          />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-act-2-gray-light">
          <Activity className="h-3.5 w-3.5 text-act-turquoise" />
          ActFlow marketplace stats
        </div>
        {m ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Tasks completed"
              value={m.tasksCompleted ?? '—'}
            />
            <Metric
              icon={<TrendingUp className="h-4 w-4" />}
              label="Total earnings"
              value={m.earnAmount ?? '—'}
            />
            <Metric
              icon={<Activity className="h-4 w-4" />}
              label="Success rate"
              value={m.successRate !== undefined ? `${m.successRate}%` : '—'}
            />
            <Metric
              icon={<Star className="h-4 w-4" />}
              label="Marketplace rating"
              value={
                m.averageRating !== undefined
                  ? `${m.averageRating} (${m.totalRatings ?? 0})`
                  : '—'
              }
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-act-2-gray-medium">
            <XCircle className="h-4 w-4 shrink-0" />
            No matching ActFlow marketplace listing for this on-chain address yet.
          </div>
        )}
      </section>

      {agent.agentUri && (
        <a
          href={agent.agentUri}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit truncate text-xs text-act-2-purple-light hover:text-act-2-purple-lighter hover:underline"
          title={agent.agentUri}
        >
          Registration: {agent.agentUri}
        </a>
      )}
    </div>
  );
};

export default ScoreBreakdownPanel;
