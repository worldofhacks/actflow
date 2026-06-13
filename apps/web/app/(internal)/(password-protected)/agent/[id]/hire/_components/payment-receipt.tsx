'use client';

import { BadgeCheck, ExternalLink, FlaskConical, Receipt as ReceiptIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, shortenAddress } from '@/lib/utils';
import { ARC_USDC, formatUsdc } from '@/lib/config/arc';
import type { ReceiptView } from '@/types/payments';

interface PaymentReceiptProps {
  receipt: ReceiptView;
  className?: string;
}

function MethodBadge({ method }: { method: ReceiptView['method'] }) {
  return method === 'world-trial' ? (
    <Badge variant="secondary" className="gap-1">
      <BadgeCheck className="size-3.5" />
      World free trial
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      USDC payment (x402)
    </Badge>
  );
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
 * Receipt screen for a completed unlock — free trial OR x402 payment.
 *
 * MOCK SAFETY: when `receipt.mock` is true we render a prominent "Demo payment
 * (mock)" banner and DO NOT show a tx hash / explorer link, so a mock unlock is
 * never presented as a real on-chain payment. Only real settlements (mock=false)
 * surface the ArcScan explorer link the API returns.
 */
export function PaymentReceipt({ receipt, className }: PaymentReceiptProps) {
  const decimal = receipt.amountDecimal ?? formatUsdc(receipt.amount);
  const isMock = receipt.mock;
  const isTrial = receipt.method === 'world-trial';

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ReceiptIcon className="size-5 text-white" />
          Payment receipt
        </CardTitle>
        <MethodBadge method={receipt.method} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
          <div className="rounded-full bg-white/10 p-2">
            <BadgeCheck className="size-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isTrial ? 'Unlocked with a free run' : 'Task unlocked'}
            </p>
            <p className="font-geistMono text-2xl font-semibold text-white">
              {isTrial ? 'Free' : `${decimal} ${ARC_USDC.symbol}`}
            </p>
          </div>
        </div>

        {/* MOCK label — must never be confused with a real payment. */}
        {isMock && !isTrial && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
            <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-300" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-amber-200">Demo payment (mock)</p>
              <p className="text-sm text-amber-100/80">
                No real funds moved and nothing was settled on-chain. This is a labeled mock used
                because no funded wallet was available.
              </p>
            </div>
          </div>
        )}

        <Separator />

        <div className="divide-y divide-white/5">
          <Row label="Method">{isTrial ? 'World free trial' : 'x402 USDC (EIP-3009)'}</Row>
          <Row label="Payer">
            {receipt.payer ? shortenAddress(receipt.payer) : '—'}
          </Row>
          <Row label="Agent">{shortenAddress(receipt.agent)}</Row>
          {!isTrial && <Row label="Amount">{`${decimal} ${ARC_USDC.symbol}`}</Row>}
          {receipt.resource && <Row label="Resource">{receipt.resource}</Row>}
          <Row label="Network">Arc Testnet ({receipt.chainId})</Row>
          <Row label="Date">{new Date(receipt.createdAt).toLocaleString()}</Row>
          {/* Real settlement only: explorer link. Mock receipts have neither. */}
          {!isMock && receipt.txHash && (
            <Row label="Transaction">
              {receipt.explorerUrl ? (
                <a
                  href={receipt.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white hover:underline"
                >
                  {shortenAddress(receipt.txHash)}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : (
                shortenAddress(receipt.txHash)
              )}
            </Row>
          )}
          <Row label="Receipt id">{receipt.id}</Row>
        </div>
      </CardContent>
    </Card>
  );
}
