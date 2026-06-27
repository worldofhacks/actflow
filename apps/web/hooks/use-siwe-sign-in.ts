'use client';

import { signIn } from 'next-auth/react';
import { useCallback } from 'react';
import type { Address } from 'viem';
import { useSignMessage } from 'wagmi';

import { signWalletNonce } from '@/lib/wallet-auth';

/**
 * Sign-In With Ethereum.
 *
 * Requests the backend's single-use nonce message (POST /auth/wallet/nonce),
 * asks the connected wallet to sign it, then hands {address, signature} to the
 * `siwe` next-auth credentials provider, which exchanges them for backend tokens
 * via POST /auth/wallet/login. The message format MUST match what the backend
 * issues, so we never build our own SIWE message here.
 */
export function useSiweSignIn() {
  const { signMessageAsync } = useSignMessage();

  return useCallback(
    async (address: Address, callbackUrl: string = '/discover') => {
      const signature = await signWalletNonce(address, signMessageAsync);
      return signIn('siwe', { address, signature, callbackUrl });
    },
    [signMessageAsync],
  );
}
