'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ExternalLink, FlaskConical, History, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, shortenAddress } from '@/lib/utils';
import { ARC_USDC, formatUsdc } from '@/lib/config/arc';
import { PaymentApiError, getReceipts } from '@/lib/payments/client';
import type { ReceiptView } from '@/types/payments';

interface PaymentHistoryProps {
  /** Filter by payer (connected wallet). */
  payer?: string;
  /** Filter by agent address. */
  agent?: string;
  /** Bump to force a refetch (e.g. after a new payment settles). */
  refreshKey?: number;
  className?: string;
}

function ReceiptRow({ r }: { r: ReceiptView }) {
  const decimal = r.amountDecimal ?? formatUsdc(r.amount);
  const isTrial = r.method === 'world-trial';
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-geistMono text-sm font-semibold text-white">
            {isTrial ? 'Free' : `${decimal} ${ARC_USDC.symbol}`}
          </span>
          {r.mock && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <FlaskConical className="size-3" />
              Mock
            </Badge>
          )}
          {isTrial && (
            <Badge variant="secondary" className="text-[10px]">
              Free trial
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {r.resource ? `${r.resource} · ` : ''}
          {new Date(r.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {!r.mock && r.txHash && r.explorerUrl ? (
          <a
            href={r.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-white hover:underline"
          >
            {shortenAddress(r.txHash)}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">{shortenAddress(r.agent)}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Payment history (GET /payments/receipts), newest first. Filters by the
 * connected wallet (payer) and/or the agent on the page. Renders explicit
 * loading / empty / error states — never an unbounded spinner. Mock receipts are
 * clearly labeled and never carry an explorer link.
 */
export function PaymentHistory({ payer, agent, refreshKey = 0, className }: PaymentHistoryProps) {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;

  const [receipts, setReceipts] = useState<ReceiptView[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canQuery = Boolean(payer || agent || accessToken);

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (!canQuery) {
        setReceipts([]);
        return;
      }
      setLoading(true);
      setError(null);
      getReceipts({ payer, agent, limit: 10 }, { accessToken, signal })
        .then(res => {
          if (signal?.aborted) return;
          setReceipts(res);
        })
        .catch(err => {
          if (signal?.aborted) return;
          // A 400 (no filter / not authenticated) is just "nothing to show".
          if (err instanceof PaymentApiError && err.status === 400) {
            setReceipts([]);
            return;
          }
          setError(
            err instanceof PaymentApiError ? err.message : 'Could not load payment history.',
          );
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [payer, agent, accessToken, canQuery],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-white" />
          Payment history
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && receipts == null ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading receipts…
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-destructive">{error}</p>
        ) : !receipts || receipts.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          receipts.map(r => <ReceiptRow key={r.id} r={r} />)
        )}
      </CardContent>
    </Card>
  );
}
