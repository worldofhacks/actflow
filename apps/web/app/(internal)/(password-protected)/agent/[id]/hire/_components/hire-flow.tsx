'use client';

import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { ArrowLeft, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ARC_USDC } from '@/lib/config/arc';
import { WorldIdVerify } from '@/components/world/world-id-verify';
import { isWorldConfigured } from '@/lib/world/config';
import { WORLD_ACTION_ID } from '@/lib/world/config';
import { useHirePayment } from '@/hooks/use-hire-payment';
import { buildResourceId, deriveAgentPrice } from '@/lib/payments/pricing';
import type { AgentDetails } from '@/types/agent/agent';

import { WalletBalance } from './wallet-balance';
import { HirePaymentPanel } from './hire-payment-panel';
import { PaymentReceipt } from './payment-receipt';
import { PaymentHistory } from './payment-history';
import { TaskStatusTracker } from './task-status-tracker';

interface HireFlowProps {
  agent: AgentDetails;
  /** Optional concrete task this unlock is tied to (enables status polling). */
  taskId?: string;
  /** Rendered at the top of the sidebar column (e.g. the AgentCard). */
  sidebarTop?: React.ReactNode;
  /** Rendered below the main flow column (e.g. the define-a-task form). */
  footer?: React.ReactNode;
}

/**
 * Orchestrates the hire -> pay -> receipt flow for an agent.
 *
 * 1. PAY entry: `/payments/hire` is called via useHirePayment. A verified World
 *    free trial (worldNullifier with runs left) returns a free unlock receipt;
 *    otherwise the API returns a 402 challenge and we show the pay panel.
 * 2. Pay: either a real x402 USDC signature (connected wallet) OR a clearly
 *    labeled demo/mock settle. The receipt's `mock` flag flows through to the UI.
 * 3. Receipt: shows amount, method and (real txs only) an ArcScan explorer link;
 *    live task status polls the marketplace contract state machine when a taskId
 *    is present.
 *
 * No live Privy/Arc/World calls happen in this component beyond the user's own
 * wallet signing typed data (no value transfer) and the backend-mediated flows.
 */
export function HireFlow({ agent, taskId, sidebarTop, footer }: HireFlowProps) {
  const { address } = useAccount();
  const payment = useHirePayment();

  const [historyKey, setHistoryKey] = useState(0);

  const price = useMemo(() => deriveAgentPrice(agent), [agent]);
  const resource = useMemo(() => buildResourceId(agent, taskId), [agent, taskId]);
  const worldConfigured = isWorldConfigured();

  /** Build the hire request, attaching the World nullifier when one is available. */
  const buildHireRequest = useCallback(
    (nullifier?: string | null) => ({
      agentAddress: agent.agentId,
      resource,
      topic: agent.topic,
      price,
      description: agent.metadata?.name ? `Hire ${agent.metadata.name}` : undefined,
      ...(nullifier
        ? { worldNullifier: nullifier, worldAction: WORLD_ACTION_ID }
        : {}),
    }),
    [agent, resource, price],
  );

  /** Free-trial PAY: try to unlock with the verified World nullifier. */
  const startFreeTrial = useCallback(
    async (nullifier: string) => {
      const unlocked = await payment.startHire(buildHireRequest(nullifier));
      if (unlocked) setHistoryKey(k => k + 1);
    },
    [payment, buildHireRequest],
  );

  /** Paid PAY: call /hire to get the 402 challenge (no nullifier). */
  const startPaid = useCallback(async () => {
    await payment.startHire(buildHireRequest(null));
  }, [payment, buildHireRequest]);

  const onPayWithWallet = useCallback(async () => {
    await payment.payWithWallet();
    setHistoryKey(k => k + 1);
  }, [payment]);

  const onPayWithMock = useCallback(async () => {
    await payment.payWithMock();
    setHistoryKey(k => k + 1);
  }, [payment]);

  const { status, challenge, receipt, error } = payment;
  const isUnlocked = status === 'unlocked' && receipt;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
      {/* Main column — the flow. */}
      <div className="space-y-6 lg:col-span-2">
        {/* World ID free-trial CTA (paid fallback is below). */}
        {worldConfigured && !isUnlocked && (
          <WorldIdVerify
            signal={address}
            onVerified={nullifier => {
              if (nullifier) void startFreeTrial(nullifier);
            }}
            onExhausted={() => {
              // No free runs — make sure the paid challenge is fetched.
              if (status === 'idle' || status === 'failed') void startPaid();
            }}
          />
        )}

        {/* Idle / entry: the PAY button that kicks off /payments/hire. */}
        {!isUnlocked && status !== 'payment_required' && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-white" />
                Hire {agent.metadata?.name || 'this agent'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price per task</p>
                  <p className="font-geistMono text-2xl font-semibold text-white">
                    {price} <span className="text-base font-normal text-muted-foreground">{ARC_USDC.symbol}</span>
                  </p>
                </div>
                {agent.topic && <Badge variant="secondary">{agent.topic}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Final price is confirmed by the marketplace when you proceed.
                {worldConfigured ? ' Verify with World ID above to use a free run instead.' : ''}
              </p>
              <Button
                type="button"
                onClick={startPaid}
                disabled={status === 'hiring'}
                className="w-full"
              >
                {status === 'hiring' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Preparing payment…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Pay {price} {ARC_USDC.symbol} to hire
                  </>
                )}
              </Button>
              {status === 'failed' && error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 402 challenge -> pay panel (real USDC or labeled mock). */}
        {!isUnlocked && status !== 'idle' && status !== 'hiring' && challenge && (
          <HirePaymentPanel
            challenge={challenge}
            status={status}
            walletAddress={address}
            error={error}
            onPayWithWallet={onPayWithWallet}
            onPayWithMock={onPayWithMock}
          />
        )}

        {/* Success — receipt + live task status. */}
        {isUnlocked && receipt && (
          <>
            <PaymentReceipt receipt={receipt} />
            <TaskStatusTracker taskId={taskId ?? receipt.taskId} />
            <div>
              <Button type="button" variant="secondary" onClick={payment.reset}>
                <ArrowLeft className="size-4" />
                Hire again
              </Button>
            </div>
          </>
        )}

        {footer}
      </div>

      {/* Sidebar — agent card (optional) + wallet balance + history. */}
      <div className="space-y-6">
        {sidebarTop}
        <WalletBalance address={address} />
        <PaymentHistory payer={address} agent={agent.agentId} refreshKey={historyKey} />
      </div>
    </div>
  );
}
