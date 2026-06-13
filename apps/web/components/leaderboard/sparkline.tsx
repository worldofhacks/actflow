'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  /** Daily activity counts, oldest -> newest. */
  data: number[];
  className?: string;
  width?: number;
  height?: number;
  /** Stroke / fill colour (defaults to the act-2 purple). */
  color?: string;
}

/**
 * Tiny inline activity sparkline rendered as a single SVG path — no chart
 * library. Shows the agent's daily feedback counts (oldest -> newest) as a
 * filled area + line. Flat/empty data renders a baseline so rows never collapse.
 */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  className,
  width = 96,
  height = 28,
  color = '#9C98DD',
}) => {
  // Hooks must run unconditionally — declare before any early return.
  const gradId = React.useId();

  const values = Array.isArray(data) ? data : [];
  const total = values.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);

  // Empty state: a muted flat baseline.
  if (values.length === 0 || total === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn('overflow-visible', className)}
        role="img"
        aria-label="No recent activity"
      >
        <line
          x1={0}
          y1={height - 2}
          x2={width}
          y2={height - 2}
          stroke="currentColor"
          strokeWidth={1}
          className="text-act-2-gray-dark"
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? width / (n - 1) : width;
  const pad = 2;
  const usableH = height - pad * 2;

  const points = values.map((v, i) => {
    const x = n > 1 ? i * stepX : width / 2;
    const norm = max > 0 ? v / max : 0;
    const y = pad + (1 - norm) * usableH;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    `M${points[0][0].toFixed(2)},${height} ` +
    points.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(' ') +
    ` L${points[points.length - 1][0].toFixed(2)},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={`Activity sparkline, ${total} feedback over ${n} days`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Highlight the most-recent point. */}
      <circle cx={points[n - 1][0]} cy={points[n - 1][1]} r={1.75} fill={color} />
    </svg>
  );
};

export default Sparkline;
