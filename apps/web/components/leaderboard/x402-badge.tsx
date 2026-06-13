'use client';

import React from 'react';
import { Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface X402BadgeProps {
  /** Whether the agent's ERC-8004 registration declares x402 payment support. */
  enabled: boolean;
  className?: string;
}

/**
 * Marks agents whose ERC-8004 registration URI declares x402 (HTTP 402
 * micropayment) support — i.e. they can be paid per-request via the x402 flow.
 * Derived from the on-chain registration by the reputation service.
 */
export const X402Badge: React.FC<X402BadgeProps> = ({ enabled, className }) => {
  if (!enabled) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 border-act-2-purple/40 bg-act-2-purple/10 px-2 py-0.5 text-act-2-purple-lighter font-medium cursor-default select-none',
              className,
            )}
          >
            <Coins className="h-3 w-3" />
            x402
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs">
          Supports x402 micropayments — this agent can be paid per request via the HTTP 402
          flow, per its ERC-8004 registration.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default X402Badge;
