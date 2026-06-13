'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

import { WORLD_ACTION_ID } from '@/lib/world/config';
import { WorldApiError, getTrials, verifyProof } from '@/lib/world/client';
import { isTrialAlreadyUsed } from '@/types/world';

export type WorldTrialStatus =
  | 'idle' // not yet verified, trial status unknown
  | 'loading' // querying existing trial state
  | 'verifying' // backend is verifying a fresh proof
  | 'verified' // verified, has >=1 free run left
  | 'exhausted' // verified but 0 free runs left -> paid flow
  | 'used' // backend says this human already used their trial
  | 'error'; // verify/network failure

export interface UseWorldTrialResult {
  status: WorldTrialStatus;
  nullifier: string | null;
  freeTrialsRemaining: number | null;
  /** Last error message, if status === 'error'. */
  error: string | null;
  /** Forward an IDKit result payload to the backend for verification. */
  verify: (payload: unknown) => Promise<void>;
  /** Reset transient error state back to idle (e.g. after the user cancels). */
  reset: () => void;
}

/**
 * Owns the World ID free-trial state for the hire flow:
 * - on mount, if the user is JWT-authenticated, loads any existing trial balance
 * - exposes `verify()` to forward an IDKit proof payload to apps/api
 * - maps backend responses/error codes to a small status machine the UI renders
 */
export function useWorldTrial(): UseWorldTrialResult {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;

  const [status, setStatus] = useState<WorldTrialStatus>('idle');
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [freeTrialsRemaining, setFreeTrialsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Load any existing trial balance for the logged-in user on mount.
  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    setStatus('loading');
    getTrials({ accessToken, signal: controller.signal })
      .then(res => {
        if (controller.signal.aborted) return;
        setNullifier(res.nullifier);
        setFreeTrialsRemaining(res.freeTrialsRemaining);
        if (res.nullifier) {
          setStatus(res.freeTrialsRemaining > 0 ? 'verified' : 'exhausted');
        } else {
          setStatus('idle');
        }
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        // A missing balance is not an error — just means "not verified yet".
        if (err instanceof WorldApiError && err.status === 404) {
          setStatus('idle');
          return;
        }
        // Don't hard-fail the page over a balance lookup; fall back to idle.
        setStatus('idle');
      });
    return () => controller.abort();
  }, [accessToken]);

  const verify = useCallback(
    async (payload: unknown) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      setStatus('verifying');
      try {
        const res = await verifyProof(payload, {
          accessToken,
          action: WORLD_ACTION_ID,
          signal: controller.signal,
        });
        setNullifier(res.nullifier);
        setFreeTrialsRemaining(res.freeTrialsRemaining);
        setStatus(res.freeTrialsRemaining > 0 ? 'verified' : 'exhausted');
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof WorldApiError) {
          if (isTrialAlreadyUsed(err.code)) {
            // Already used their one free trial -> hand off to the paid flow.
            setFreeTrialsRemaining(0);
            setStatus('used');
            return;
          }
          setError(err.message);
        } else {
          setError('Verification failed. Please try again.');
        }
        setStatus('error');
      }
    },
    [accessToken],
  );

  const reset = useCallback(() => {
    setError(null);
    // Return to the best-known non-error state.
    setStatus(prev => {
      if (prev !== 'error') return prev;
      if (nullifier) return (freeTrialsRemaining ?? 0) > 0 ? 'verified' : 'exhausted';
      return 'idle';
    });
  }, [nullifier, freeTrialsRemaining]);

  return { status, nullifier, freeTrialsRemaining, error, verify, reset };
}
