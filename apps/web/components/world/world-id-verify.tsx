'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IDKitErrorCodes,
  IDKitRequestWidget,
  proofOfHuman,
  type IDKitResult,
  type RpContext,
} from '@worldcoin/idkit';
import { useAccount } from 'wagmi';
import { AlertCircle, BadgeCheck, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useWorldTrial } from '@/hooks/use-world-trial';
import { fetchRpContext } from '@/lib/world/client';
import {
  WORLD_ACTION_ID,
  WORLD_APP_ID,
  WORLD_ENVIRONMENT,
  isWorldConfigured,
} from '@/lib/world/config';

/** IDKit error codes that mean the user backed out — not a real failure. */
const CANCEL_CODES = new Set<string>([
  IDKitErrorCodes.UserRejected,
  IDKitErrorCodes.Cancelled,
  IDKitErrorCodes.VerificationRejected,
]);

interface WorldIdVerifyProps {
  /**
   * The signal bound into the proof — the hiring user's wallet address. Binding
   * the proof to the address stops it being replayed for a different wallet.
   * Falls back to the connected wagmi account when not supplied.
   */
  signal?: string;
  /** Called when the user has at least one free run available. */
  onVerified?: (nullifier: string, freeTrialsRemaining: number) => void;
  /** Called when trials are exhausted / already used — hand off to the paid flow. */
  onExhausted?: () => void;
  className?: string;
}

/**
 * "Verify with World ID — get 3 free agent runs" CTA + IDKit widget.
 *
 * Flow:
 *  1. User clicks the CTA -> we fetch a freshly-signed RpContext from our own
 *     /api/world/rp-context route (signing key stays server-side).
 *  2. The IDKitRequestWidget opens; the user proves humanness in World App (or the
 *     simulator for staging demos).
 *  3. handleVerify forwards the IDKit result payload AS-IS to apps/api, which does
 *     the real proof verification and returns the remaining free-trial balance.
 *
 * All proof verification is server-side; this component never calls the World API.
 */
export function WorldIdVerify({ signal, onVerified, onExhausted, className }: WorldIdVerifyProps) {
  const { address } = useAccount();
  const effectiveSignal = signal ?? address ?? '';

  const { status, nullifier, freeTrialsRemaining, error, verify, reset } = useWorldTrial();

  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [initializing, setInitializing] = useState(false);

  const configured = isWorldConfigured();

  // Notify the parent exactly once per terminal outcome change.
  const lastNotified = useRef<string>('');
  useEffect(() => {
    const key = `${status}:${freeTrialsRemaining ?? ''}`;
    if (key === lastNotified.current) return;
    if (status === 'verified' && (freeTrialsRemaining ?? 0) > 0) {
      lastNotified.current = key;
      onVerified?.(nullifier ?? '', freeTrialsRemaining ?? 0);
    } else if (status === 'exhausted' || status === 'used') {
      lastNotified.current = key;
      onExhausted?.();
    }
  }, [status, freeTrialsRemaining, nullifier, onVerified, onExhausted]);

  // Forward the IDKit result payload AS-IS for server-side verification.
  const handleVerify = useCallback(
    async (result: IDKitResult) => {
      await verify(result);
    },
    [verify],
  );

  const handleSuccess = useCallback(() => {
    // Trial balance is driven by the backend response inside `verify`. Surface
    // the outcome once the widget closes; the parent reacts via the effects below.
    setOpen(false);
  }, []);

  const handleError = useCallback(
    (code: IDKitErrorCodes) => {
      setOpen(false);
      if (CANCEL_CODES.has(code)) {
        // User cancelled — quietly return to idle, no scary error.
        reset();
        return;
      }
      toast({
        variant: 'destructive',
        title: 'World ID verification failed',
        description: `Could not complete verification (${code}). Please try again.`,
      });
    },
    [reset],
  );

  const startVerification = useCallback(async () => {
    if (!configured) return;
    setInitializing(true);
    try {
      const ctx = await fetchRpContext();
      setRpContext(ctx);
      setOpen(true);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Could not start World ID',
        description: 'Verification is temporarily unavailable. Please try again shortly.',
      });
    } finally {
      setInitializing(false);
    }
  }, [configured]);

  // --- Render states -------------------------------------------------------

  if (!configured) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-start gap-3 p-5">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">World ID is not configured</p>
            <p className="text-sm text-muted-foreground">
              Set NEXT_PUBLIC_WORLD_APP_ID and NEXT_PUBLIC_WORLD_ACTION_ID to enable free agent
              runs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasTrials = (freeTrialsRemaining ?? 0) > 0;
  const isVerifiedWithRuns = status === 'verified' && hasTrials;
  const isExhausted = status === 'exhausted' || status === 'used';

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-white" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {isVerifiedWithRuns
                ? "You're verified as a unique human"
                : 'Verify with World ID — get 3 free agent runs'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isVerifiedWithRuns
                ? 'Free agent runs are unlocked for this task.'
                : 'Prove you are a unique human to unlock free agent runs. No personal data is shared.'}
            </p>
          </div>
        </div>

        {/* Verified with runs remaining: show the trial counter. */}
        {isVerifiedWithRuns && (
          <div className="flex items-center gap-2">
            <Badge className="gap-1 bg-white text-black">
              <BadgeCheck className="size-3.5" />
              {freeTrialsRemaining}/3 free runs left
            </Badge>
          </div>
        )}

        {/* Exhausted / already used: hand off to the paid flow. */}
        {isExhausted && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {status === 'used'
                  ? 'This human has already used their free trial.'
                  : "You've used all of your free agent runs."}{' '}
                Continue by paying per task below.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => onExhausted?.()}>
              Continue with paid task
            </Button>
          </div>
        )}

        {/* Error state (non-cancel). */}
        {status === 'error' && error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Primary CTA — shown until the user is verified with runs / exhausted. */}
        {!isVerifiedWithRuns && !isExhausted && (
          <Button
            type="button"
            onClick={startVerification}
            disabled={initializing || status === 'verifying' || status === 'loading'}
            className="w-full"
          >
            {initializing || status === 'verifying' ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {status === 'verifying' ? 'Verifying…' : 'Starting…'}
              </>
            ) : status === 'error' ? (
              'Try again'
            ) : (
              <>
                <ShieldCheck className="size-4" />
                Verify with World ID — get 3 free agent runs
              </>
            )}
          </Button>
        )}

        {/* The IDKit widget itself is headless until opened. */}
        {rpContext && WORLD_APP_ID && WORLD_ACTION_ID && (
          <IDKitRequestWidget
            open={open}
            onOpenChange={setOpen}
            app_id={WORLD_APP_ID}
            action={WORLD_ACTION_ID}
            rp_context={rpContext}
            // Accept both v4 and legacy v3 (orb) proofs during the migration window.
            allow_legacy_proofs={true}
            environment={WORLD_ENVIRONMENT}
            preset={proofOfHuman({ signal: effectiveSignal })}
            handleVerify={handleVerify}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}
      </CardContent>
    </Card>
  );
}
