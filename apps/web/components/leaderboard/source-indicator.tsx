'use client';

import React from 'react';
import { Database, FlaskConical, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DataSource } from '@/types/reputation';

interface SourceIndicatorProps {
  source: DataSource | null;
  className?: string;
}

/**
 * Honest data-provenance badge. The reputation API returns `source: "live"`
 * only when GOOGLE_APPLICATION_CREDENTIALS + GCP_PROJECT_ID are present (real
 * BigQuery over Ethereum mainnet ERC-8004 logs); otherwise it returns
 * `source: "fixture"` — clearly-labelled sample data. We surface that flag
 * verbatim so the demo never presents fixtures as live on-chain data.
 */
export const SourceIndicator: React.FC<SourceIndicatorProps> = ({ source, className }) => {
  const isLive = source === 'live';
  const isUnknown = source === null;

  const label = isUnknown ? 'Source unknown' : isLive ? 'Live on-chain' : 'Sample data';

  const tip = isLive
    ? 'Live ERC-8004 reputation from Ethereum mainnet via Google BigQuery.'
    : isUnknown
      ? 'Could not determine the reputation data source yet.'
      : 'Clearly-labelled SAMPLE / FIXTURE data — not live on-chain. The service switches to live BigQuery automatically when GCP credentials are configured.';

  const Icon = isLive ? Wifi : isUnknown ? Database : FlaskConical;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 border px-2.5 py-1 font-medium cursor-default select-none',
              isLive
                ? 'border-act-turquoise/40 bg-act-turquoise/10 text-act-turquoise'
                : isUnknown
                  ? 'border-act-2-gray-dark bg-white/5 text-act-2-gray-light'
                  : 'border-act-gold/40 bg-act-gold/10 text-act-gold',
              className,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SourceIndicator;
