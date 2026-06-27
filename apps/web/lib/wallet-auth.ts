'use client';

import { requestWalletNonce } from './service/authService';

type SignMessageFn = (args: { message: string }) => Promise<`0x${string}`>;

/**
 * SIWE: request the backend's single-use nonce message for `address`, then ask
 * the connected wallet to sign that EXACT message. The returned signature is
 * what /auth/wallet/register and /auth/wallet/login verify server-side against
 * the issued nonce. Throws with a useful message on failure.
 */
export async function signWalletNonce(
  address: string,
  signMessageAsync: SignMessageFn,
): Promise<`0x${string}`> {
  const res = await requestWalletNonce(address);
  if (!res?.success || !res.data?.message) {
    throw new Error(res?.error || res?.message || 'Could not request a wallet sign-in nonce');
  }
  return signMessageAsync({ message: res.data.message });
}
