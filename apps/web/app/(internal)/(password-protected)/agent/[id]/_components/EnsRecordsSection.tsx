'use client';

import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Globe,
  Link2,
  ServerCog,
  Tag as TagIcon,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useAgentEns } from '@/hooks/use-agent-ens';
import { resolveAgentEns, type ResolveAgentEnsResult } from '@/lib/service/ensService';
import type { AgentProfile } from '@actflow/integrations-ens';

interface EnsRecordsSectionProps {
  /** Agent 0x address (agentId) used to reverse-resolve the ENS name. */
  address?: string | null;
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'loaded'; profile: AgentProfile };

function hasAnyRecord(p: AgentProfile): boolean {
  return Boolean(
    p.context ||
      p.description ||
      p.url ||
      p.avatar ||
      p.pricing ||
      p.x402 !== undefined ||
      (p.capabilities && p.capabilities.length) ||
      (p.endpoints && Object.values(p.endpoints).some(Boolean)) ||
      p.registration,
  );
}

/**
 * Live ENSIP-26 agent text records for an agent that has an ENS name.
 *
 * Flow: reverse-resolve the agent address to its primary ENS name (mainnet,
 * via wagmi), then read the agent's text records on mainnet through the
 * resolveAgentEns server action. Renders EXPLICIT idle / loading / empty /
 * error states — never an unbounded spinner: the name lookup itself resolves
 * to a name or null, and the records fetch always settles into loaded/empty/
 * error.
 */
const EnsRecordsSection = ({ address }: EnsRecordsSectionProps) => {
  const { ensName, isLoading: nameLoading } = useAgentEns(address);
  const [state, setState] = useState<LoadState>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;
    if (!ensName) {
      setState({ kind: 'idle' });
      return;
    }
    setState({ kind: 'loading' });
    resolveAgentEns(ensName)
      .then((res: ResolveAgentEnsResult) => {
        if (cancelled) return;
        if (res.error) {
          setState({ kind: 'error', message: res.error });
          return;
        }
        if (!res.profile || !hasAnyRecord(res.profile)) {
          setState({ kind: 'empty' });
          return;
        }
        setState({ kind: 'loaded', profile: res.profile });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Failed to read ENS records',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [ensName]);

  // No ENS name for this agent and the reverse lookup has settled — hide the
  // whole section rather than show an empty card.
  if (!ensName && !nameLoading) return null;

  return (
    <Card className="mb-6" id="ens-records">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-act-2-purple" />
          ENS Identity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {ensName && (
          <div className="flex items-center gap-2 mb-5">
            <Badge variant="secondary" className="font-medium">
              {ensName}
            </Badge>
            <span className="text-xs text-gray-400">Verified on-chain identity</span>
          </div>
        )}

        {/* Name still resolving */}
        {!ensName && nameLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
        )}

        {/* Records loading */}
        {state.kind === 'loading' && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Icons.spinner className="h-4 w-4 animate-spin text-act-2-purple" />
            Reading on-chain agent records…
          </div>
        )}

        {/* Records error */}
        {state.kind === 'error' && (
          <div className="bg-destructive/10 border border-destructive/40 rounded-lg p-4 text-sm text-destructive">
            Could not read ENS records: {state.message}
          </div>
        )}

        {/* No records set */}
        {state.kind === 'empty' && (
          <div className="bg-act-2-midnight-blue rounded-lg p-4 text-sm text-gray-400">
            This agent has an ENS name but has not published agent records yet.
          </div>
        )}

        {/* Records loaded */}
        {state.kind === 'loaded' && <RecordsView profile={state.profile} />}
      </CardContent>
    </Card>
  );
};

function RecordsView({ profile }: { profile: AgentProfile }) {
  const description = profile.description || profile.context;
  const endpoints = Object.entries(profile.endpoints ?? {}).filter(
    ([, v]) => Boolean(v),
  );

  return (
    <div className="space-y-5">
      {description && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Description</h4>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {profile.capabilities && profile.capabilities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
            <TagIcon className="h-4 w-4 text-act-2-purple" /> Capabilities
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.capabilities.map(cap => (
              <Badge key={cap} variant="outline" className="text-act-2-gray-light">
                {cap}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(profile.url || endpoints.length > 0) && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
            <ServerCog className="h-4 w-4 text-act-2-purple" /> Endpoints
          </h4>
          <div className="space-y-2">
            {profile.url && (
              <a
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-act-2-purple-lighter hover:underline break-all"
              >
                <Globe className="h-4 w-4 shrink-0" /> {profile.url}
              </a>
            )}
            {endpoints.map(([protocol, value]) => (
              <a
                key={protocol}
                href={value as string}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-act-2-purple-lighter hover:underline break-all"
              >
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="uppercase text-xs text-gray-400 mr-1">{protocol}</span>
                {value}
              </a>
            ))}
          </div>
        </div>
      )}

      {(profile.x402 !== undefined || profile.pricing) && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-act-2-purple" /> Payments
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            {profile.x402 !== undefined && (
              <Badge variant={profile.x402 ? 'default' : 'secondary'}>
                {profile.x402 ? 'Accepts x402 (USDC)' : 'No x402'}
              </Badge>
            )}
            {profile.pricing && (
              <span className="text-sm text-gray-400">{profile.pricing}</span>
            )}
          </div>
        </div>
      )}

      {profile.registration && (
        <div className="bg-white/[0.03] rounded-lg p-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-white font-medium mb-1">
            <BadgeCheck className="h-4 w-4 text-act-2-purple" /> ERC-8004 registration
          </div>
          <div className="break-all">Agent ID: {profile.registration.agentId}</div>
        </div>
      )}

      {profile.avatar && (
        <Link
          href={profile.avatar}
          target="_blank"
          className="text-xs text-gray-500 hover:underline break-all"
        >
          avatar: {profile.avatar}
        </Link>
      )}
    </div>
  );
}

export default EnsRecordsSection;
