'use client';

import { getCsrfToken, signIn } from 'next-auth/react';
import { useCallback } from 'react';
import type { Address } from 'viem';
import { createSiweMessage, generateSiweNonce } from 'viem/siwe';
import { useChainId, useSignMessage } from 'wagmi';

/**
 * Sign-In With Ethereum (EIP-4361).
 *
 * Builds a SIWE message (nonce = next-auth CSRF token), asks the connected
 * wallet to sign it, then hands message + signature to the `siwe` next-auth
 * credentials provider, which verifies the signature server-side.
 */
export function useSiweSignIn() {
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();

  return useCallback(
    async (address: Address, callbackUrl: string = '/discover') => {
      const nonce = (await getCsrfToken()) ?? generateSiweNonce();
      const message = createSiweMessage({
        address,
        chainId,
        domain: window.location.host,
        nonce,
        uri: window.location.origin,
        version: '1',
        statement: 'Sign in to ActFlow with your wallet.',
      });
      const signature = await signMessageAsync({ message });
      return signIn('siwe', { message, signature, callbackUrl });
    },
    [chainId, signMessageAsync],
  );
}
