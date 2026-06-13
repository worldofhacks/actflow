'use client';

import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  FlaskConical,
  Fingerprint,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { chainLabel, erc8004AddressUrl, erc8004TxUrl } from '@/lib/config/erc8004';
import { cn, shortenAddress } from '@/lib/utils';
import type { ProvisionResult } from '@/types/provisioning';

interface AgentProvisionResultProps {
  result: ProvisionResult;
  /** Where to send the user to view the agent's ENS-powered profile. */
  profileHref: string;
  className?: string;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-white break-all">{children}</span>
    </div>
  );
}

/**
 * Confirmation step shown after an agent is created + its identity provisioned.
 *
 * MOCK / DRY-RUN SAFETY: this NEVER implies a real on-chain mint happened unless
 * the API reports a real binding. We read `identityStatus` ('dry-run' | 'bound')
 * and `provisionDryRun` straight from the API:
 *   - 'dry-run' / provisionDryRun => a prominent "Preview (no funds)" banner and
 *     NO binding tx hash / explorer link. The ENS name + ERC-8004 id are labeled
 *     as a would-be preview.
 *   - 'bound'   => a "Live" badge and, when present, the real binding tx with an
 *     explorer link.
 *
 * Registry address + chain id are rendered VERBATIM from the API response (never
 * invented client-side); the API resolves them from @actflow/agents' cited
 * registry map (erc8004-bigquery skill).
 */
export function AgentProvisionResult({
  result,
  profileHref,
  className,
}: AgentProvisionResultProps) {
  const isLive = result.identityStatus === 'bound' && !result.provisionDryRun;
  const isPreview = !isLive;

  const registryUrl = result.registryAddress
    ? erc8004AddressUrl(result.chainId, result.registryAddress)
    : undefined;
  const bindingTxUrl =
    isLive && result.bindingTxHash
      ? erc8004TxUrl(result.chainId, result.bindingTxHash)
      : undefined;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="size-5 text-white" />
          Agent identity
        </CardTitle>
        {isLive ? (
          <Badge variant="secondary" className="gap-1">
            <BadgeCheck className="size-3.5" />
            Live (on-chain)
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <FlaskConical className="size-3.5" />
            Preview (no funds)
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hero: the minted (or preview) ENS name. */}
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
          <div className="rounded-full bg-white/10 p-2">
            <BadgeCheck className="size-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {isLive ? 'ENS identity bound on-chain' : 'ENS identity (preview)'}
            </p>
            <p className="font-geistMono text-2xl font-semibold text-white break-all">
              {result.ensName || '—'}
            </p>
          </div>
        </div>

        {/*
         * DRY-RUN / PREVIEW banner — must never be confused with a real mint.
         * Mirrors the payments mock banner (design system).
         */}
        {isPreview && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
            <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-300" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-amber-200">Preview only — no on-chain mint</p>
              <p className="text-sm text-amber-100/80">
                {result.note ||
                  'No funds or signer were available, so this is a labeled preview of the agent identity. Nothing was minted or written on-chain.'}
              </p>
            </div>
          </div>
        )}

        <Separator />

        <div className="divide-y divide-white/5">
          <Row label="Agent wallet">
            {registryUrl ? (
              <a
                href={erc8004AddressUrl(result.chainId, result.agentAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-white hover:underline"
              >
                {shortenAddress(result.agentAddress)}
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              shortenAddress(result.agentAddress)
            )}
          </Row>

          <Row label="ENS name">{result.ensName || '—'}</Row>

          <Row label="ERC-8004 id">
            {result.erc8004Id ? result.erc8004Id : <span className="text-muted-foreground">—</span>}
          </Row>

          {result.registryAddress && (
            <Row label="ERC-8004 registry">
              {registryUrl ? (
                <a
                  href={registryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white hover:underline"
                >
                  {shortenAddress(result.registryAddress)}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : (
                shortenAddress(result.registryAddress)
              )}
            </Row>
          )}

          <Row label="Network">{chainLabel(result.chainId)}</Row>

          {/* AgentIdentityExtension binding link (the contract call args). */}
          <Row label="Identity binding">
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5 text-muted-foreground" />
              {isLive ? 'setIdentity executed' : 'setIdentity (preview)'}
            </span>
          </Row>

          {/* Real binding tx + explorer link ONLY when actually bound on-chain. */}
          {isLive && result.bindingTxHash && (
            <Row label="Binding tx">
              {bindingTxUrl ? (
                <a
                  href={bindingTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white hover:underline"
                >
                  {shortenAddress(result.bindingTxHash)}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : (
                shortenAddress(result.bindingTxHash)
              )}
            </Row>
          )}
        </div>

        <Separator />

        {/* ENS records that were written (or would be written in preview). */}
        {result.records?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">
              ENS records {isPreview && <span className="text-muted-foreground">(preview)</span>}
            </p>
            <div className="space-y-1 rounded-2xl bg-white/5 p-3">
              {result.records.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-0.5 break-all">
                  <span className="text-xs font-medium text-act-2-purple-light">{key}</span>
                  <span className="text-xs text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button asChild className="w-full">
          <Link href={profileHref} className="flex items-center justify-center">
            View agent profile
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
