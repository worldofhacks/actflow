'use client';

import { useCallback, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAccount, useChainId, useSignTypedData, useSwitchChain } from 'wagmi';

import { ARC_CHAIN_ID } from '@/lib/config/arc';
import {
  PaymentApiError,
  hire as hireApi,
  settle as settleApi,
} from '@/lib/payments/client';
import {
  MOCK_PAYER_PLACEHOLDER,
  buildMockPayload,
  buildSignedPayload,
  buildTypedData,
} from '@/lib/payments/eip3009';
import type {
  HireRequest,
  PaymentChallenge,
  ReceiptView,
  SettleResponse,
} from '@/types/payments';
import { isPaymentRequired } from '@/types/payments';

/** The hire/pay state machine surfaced to the UI. */
export type HirePaymentStatus =
  | 'idle'
  | 'hiring' // calling /payments/hire
  | 'payment_required' // got a 402 challenge, awaiting pay/mock action
  | 'signing' // wallet is signing the EIP-3009 authorization
  | 'settling' // posting payload to /payments/settle
  | 'unlocked' // success — receipt available
  | 'failed'; // unrecoverable error OR verification failed

export interface UseHirePaymentResult {
  status: HirePaymentStatus;
  /** The active 402 challenge (set once /hire returns payment required). */
  challenge: PaymentChallenge | null;
  /** The receipt on success (free trial OR settled payment). */
  receipt: ReceiptView | null;
  /** How the task got unlocked, once known. */
  method: 'world-trial' | 'x402' | null;
  /** True when the unlocking receipt is a labeled mock (no real funds moved). */
  mock: boolean;
  /** Last error / failure reason for the UI. */
  error: string | null;

  /** Step 1: call /payments/hire. Returns true if already unlocked (free trial). */
  startHire: (req: HireRequest) => Promise<boolean>;
  /** Step 2a: real x402 payment — sign with the connected wallet then settle. */
  payWithWallet: () => Promise<void>;
  /** Step 2b: clearly-labeled DEMO payment — settle a mock payload (no funds). */
  payWithMock: () => Promise<void>;
  /** Reset back to idle (e.g. to retry from scratch). */
  reset: () => void;
}

/**
 * Owns the hire -> pay -> settle flow against apps/api `/payments/*`.
 *
 * - `startHire` posts the unlock request. A valid World free-trial returns a
 *   receipt immediately (status -> 'unlocked'); otherwise we hold the 402
 *   challenge and move to 'payment_required'.
 * - `payWithWallet` signs the EIP-3009 authorization with the connected wallet
 *   (real path) and settles it. The `mock` flag from the API response is the
 *   source of truth for whether funds actually moved.
 * - `payWithMock` settles a clearly-labeled mock payload — used when there are
 *   no Arc funds / no connected wallet. The resulting receipt is mock:true and
 *   the UI must present it as a demo, never as a real on-chain payment.
 *
 * No live Privy/Arc calls happen here: the only chain interaction is the user's
 * own wallet signing typed data (no value transfer), and even that is skipped on
 * the mock path.
 */
export function useHirePayment(): UseHirePaymentResult {
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { signTypedDataAsync } = useSignTypedData();

  const [status, setStatus] = useState<HirePaymentStatus>('idle');
  const [challenge, setChallenge] = useState<PaymentChallenge | null>(null);
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);
  const [method, setMethod] = useState<'world-trial' | 'x402' | null>(null);
  const [mock, setMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setChallenge(null);
    setReceipt(null);
    setMethod(null);
    setMock(false);
    setError(null);
  }, []);

  const startHire = useCallback(
    async (req: HireRequest): Promise<boolean> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      setReceipt(null);
      setStatus('hiring');
      try {
        const res = await hireApi(req, { accessToken, signal: controller.signal });
        if (isPaymentRequired(res)) {
          setChallenge(res.challenge);
          setStatus('payment_required');
          return false;
        }
        // World free-trial unlock — receipt already written server-side.
        setReceipt(res.receipt);
        setMethod('world-trial');
        setMock(res.receipt.mock);
        setStatus('unlocked');
        return true;
      } catch (err) {
        if (controller.signal.aborted) return false;
        setError(
          err instanceof PaymentApiError ? err.message : 'Could not start the hire. Please try again.',
        );
        setStatus('failed');
        return false;
      }
    },
    [accessToken],
  );

  /** Shared settle step. Applies the API's mock flag + receipt to state. */
  const runSettle = useCallback(
    async (
      activeChallenge: PaymentChallenge,
      payload: Parameters<typeof settleApi>[0]['payload'],
      controller: AbortController,
    ): Promise<SettleResponse | null> => {
      setStatus('settling');
      const res = await settleApi(
        { challenge: activeChallenge, payload, resource: activeChallenge.resource },
        { accessToken, signal: controller.signal },
      );
      if (controller.signal.aborted) return null;
      if (res.paid && res.unlocked && res.receipt) {
        setReceipt(res.receipt);
        setMethod('x402');
        setMock(res.mock);
        setStatus('unlocked');
      } else {
        setMock(res.mock);
        setError(res.reason || 'Payment verification failed.');
        setStatus('failed');
      }
      return res;
    },
    [accessToken],
  );

  const payWithWallet = useCallback(async () => {
    if (!challenge) {
      setError('No active payment challenge.');
      setStatus('failed');
      return;
    }
    if (!address) {
      setError('Connect a wallet to pay with USDC, or use the demo payment.');
      setStatus('failed');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setStatus('signing');
    try {
      // Ensure the wallet is on Arc so the EIP-712 chainId matches the domain.
      if (chainId !== ARC_CHAIN_ID) {
        await switchChainAsync({ chainId: ARC_CHAIN_ID });
      }
      const typedData = buildTypedData(challenge, address as `0x${string}`);
      const signature = await signTypedDataAsync({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });
      const payload = buildSignedPayload(challenge, address as `0x${string}`, signature);
      await runSettle(challenge, payload, controller);
    } catch (err) {
      if (controller.signal.aborted) return;
      // A user rejecting the signature should not look like a hard failure.
      const msg =
        err instanceof PaymentApiError
          ? err.message
          : err instanceof Error && /reject|denied|cancel/i.test(err.message)
            ? 'Signature request was cancelled.'
            : 'Could not complete the payment. Please try again.';
      setError(msg);
      setStatus('failed');
    }
  }, [challenge, address, chainId, switchChainAsync, signTypedDataAsync, runSettle]);

  const payWithMock = useCallback(async () => {
    if (!challenge) {
      setError('No active payment challenge.');
      setStatus('failed');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    try {
      const payer = (address as `0x${string}`) ?? MOCK_PAYER_PLACEHOLDER;
      const payload = buildMockPayload(challenge, payer);
      await runSettle(challenge, payload, controller);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof PaymentApiError ? err.message : 'Could not complete the demo payment.',
      );
      setStatus('failed');
    }
  }, [challenge, address, runSettle]);

  return {
    status,
    challenge,
    receipt,
    method,
    mock,
    error,
    startHire,
    payWithWallet,
    payWithMock,
    reset,
  };
}
