'use client';

import Link from 'next/link';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAgentEns } from '@/hooks/use-agent-ens';

interface AgentNameProps {
  /** The agent's 0x wallet address (also its agentId / route param). */
  address?: string | null;
  /** Render an ENS avatar (when one exists) next to the name. */
  showAvatar?: boolean;
  /** Wrap the name in a link to the agent profile (/agent/<address>). */
  href?: string;
  /** Optional fallback label when no address/name is available. */
  fallback?: string;
  className?: string;
  avatarClassName?: string;
}

/**
 * Displays an agent's ENS identity: its primary ENS name (reverse-resolved on
 * mainnet) and ENS avatar when present, otherwise a truncated 0x address.
 *
 * Pure presentation over the useAgentEns hook — no hard-coded names/addresses.
 * Resolution is best-effort: while the name lookup is in flight a small
 * skeleton is shown; if no name resolves, the truncated address is the final
 * (non-spinning) display.
 */
export const AgentName: React.FC<AgentNameProps> = ({
  address,
  showAvatar = false,
  href,
  fallback = 'Unknown',
  className,
  avatarClassName,
}) => {
  const { ensName, avatar, shortAddress, isLoading, display } = useAgentEns(address);

  const label = display ?? fallback;
  const title = ensName ? `${ensName} (${shortAddress})` : (shortAddress ?? fallback);

  const avatarNode = showAvatar ? (
    <Avatar className={cn('h-5 w-5 text-[10px]', avatarClassName)}>
      {avatar ? <AvatarImage src={avatar} alt={label} /> : null}
      <AvatarFallback className="bg-act-2-purple/15 text-act-2-purple-lighter">
        {(ensName ?? shortAddress ?? '?').slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  ) : null;

  const content = (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {avatarNode}
      {isLoading && !ensName ? (
        <Skeleton className="h-3.5 w-24 rounded" />
      ) : (
        <span
          className={cn('truncate', ensName ? 'font-medium' : 'font-mono')}
          title={title}
        >
          {label}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'inline-flex items-center text-act-2-gray-light hover:text-white transition-colors min-w-0',
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <span className={cn('inline-flex items-center text-act-2-gray-light min-w-0', className)}>
      {content}
    </span>
  );
};

export default AgentName;
