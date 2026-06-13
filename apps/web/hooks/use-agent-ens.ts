'use client';

import { useEnsAvatar, useEnsName } from 'wagmi';
import { normalize } from 'viem/ens';
import { ENS_RESOLUTION_CHAIN_ID, isAddress, shortenAddressSafe } from '@/lib/config/ens';

export interface UseAgentEnsResult {
  /** Primary ENS name for the agent address (mainnet), if any. */
  ensName: string | null;
  /** ENS avatar URL for the resolved name, if set. */
  avatar: string | null;
  /** Truncated 0x address — the fallback display when no ENS name exists. */
  shortAddress: string | null;
  /** True while the primary-name lookup is in flight. */
  isLoading: boolean;
  /** What to render: the ENS name when present, else the truncated address. */
  display: string | null;
}

/**
 * Resolve an agent's on-chain ENS identity for display.
 *
 * Reverse-resolves the agent's 0x address to its primary ENS name on MAINNET
 * (chain id sourced from the wagmi mainnet chain object, never hard-coded) and
 * fetches its ENS avatar. Falls back to a truncated address when no name is set.
 *
 * wagmi's useEnsName performs the forward-verification ENS recommends, so a
 * returned name is safe to display.
 */
export function useAgentEns(address?: string | null): UseAgentEnsResult {
  const valid = !!address && isAddress(address);
  const normalizedAddress = valid
    ? (address!.trim() as `0x${string}`)
    : undefined;

  const { data: ensName, isLoading: nameLoading } = useEnsName({
    address: normalizedAddress,
    chainId: ENS_RESOLUTION_CHAIN_ID,
    query: { enabled: valid },
  });

  const { data: avatar, isLoading: avatarLoading } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: ENS_RESOLUTION_CHAIN_ID,
    query: { enabled: !!ensName },
  });

  const shortAddress = valid ? shortenAddressSafe(address!) : null;
  const display = ensName ?? shortAddress;

  return {
    ensName: ensName ?? null,
    avatar: avatar ?? null,
    shortAddress,
    isLoading: nameLoading || (!!ensName && avatarLoading),
    display,
  };
}
