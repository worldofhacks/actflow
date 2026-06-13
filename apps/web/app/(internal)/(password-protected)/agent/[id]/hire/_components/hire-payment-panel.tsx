'use client';

import { AlertCircle, FlaskConical, Loader2, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn, shortenAddress } from '@/lib/utils';
import { ARC_USDC } from '@/lib/config/arc';
import type { HirePaymentStatus } from '@/hooks/use-hire-payment';
import type { PaymentChallenge } from '@/types/payments';

interface HirePaymentPanelProps {
  challenge: PaymentChallenge;
  status: HirePaymentStatus;
  /** Connected wallet address (enables the real USDC pay button). */
  walletAddress?: `0x${string}`;
  error: string | null;
  onPayWithWallet: () => void;
  onPayWithMock: () => void;
  className?: string;
}

/**
 * Presents the 402 payment challenge for the x402 USDC path and exposes two
 * affordances:
 *   - "Pay with USDC" — real EIP-3009 signature via the connected wallet (only
 *     enabled when a wallet is connected). The API decides if funds actually
 *     settle; the receipt's `mock` flag is the source of truth.
 *   - "Demo payment (mock)" — a CLEARLY LABELED mock settle for when there are no
 *     Arc funds / no wallet. Never implies a real on-chain payment.
 *
 * The World free-trial path is handled separately (above this panel); this panel
 * is the paid fallback.
 */
export function HirePaymentPanel({
  challenge,
  status,
  walletAddress,
  error,
  onPayWithWallet,
  onPayWithMock,
  className,
}: HirePaymentPanelProps) {
  const busy = status === 'signing' || status === 'settling';
  const signing = status === 'signing';
  const settling = status === 'settling';

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-5 text-white" />
          Pay to unlock
        </CardTitle>
        <Badge variant="secondary">x402 · USDC on Arc</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount + recipient summary from the 402 challenge. */}
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Amount due</p>
              <p className="font-geistMono text-3xl font-semibold text-white">
                {challenge.amountDecimal}{' '}
                <span className="text-base font-normal text-muted-foreground">
                  {challenge.asset.symbol || ARC_USDC.symbol}
                </span>
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>to {shortenAddress(challenge.recipient)}</p>
              <p>Arc Testnet ({challenge.chainId})</p>
            </div>
          </div>
          {challenge.description && (
            <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Real USDC payment via the connected wallet. */}
        <Button
          type="button"
          onClick={onPayWithWallet}
          disabled={busy || !walletAddress}
          className="w-full"
        >
          {signing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Awaiting signature…
            </>
          ) : settling ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Settling payment…
            </>
          ) : (
            <>
              <Wallet className="size-4" />
              Pay {challenge.amountDecimal} {challenge.asset.symbol || ARC_USDC.symbol}
            </>
          )}
        </Button>
        {!walletAddress && (
          <p className="-mt-2 text-center text-xs text-muted-foreground">
            Connect a wallet to pay with USDC on Arc.
          </p>
        )}

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        {/* CLEARLY LABELED mock path — no funds, no real settlement. */}
        <div className="space-y-2 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-3">
          <div className="flex items-start gap-2">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <p className="text-xs text-amber-100/80">
              No funded wallet? Use a <span className="font-semibold">demo payment</span>. It is a
              labeled mock — no real funds move and nothing settles on-chain.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onPayWithMock}
            disabled={busy}
            className="w-full border-amber-400/40"
          >
            {settling ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Recording demo receipt…
              </>
            ) : (
              <>
                <FlaskConical className="size-4" />
                Demo payment (mock)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
