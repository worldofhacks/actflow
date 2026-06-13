'use server';

/**
 * Server-side ENS resolution for the web app.
 *
 * Live agent text records (ENSIP-26) and ENS-name <-> address resolution are
 * read on MAINNET via @actflow/integrations-ens. We run these in a server
 * action (not the browser) so:
 *   - the package's node-oriented viem client + env config stay off the client
 *     bundle, and
 *   - resolution uses the app's configured MAINNET_RPC_URL (with the package's
 *     viem public-RPC fallback) regardless of the deployment's ENS_CHAIN.
 *
 * RULES: ZERO hard-coded ENS names / addresses / chain IDs. The mainnet network
 * key ("mainnet") is the integration's documented network selector (it maps to
 * viem's `mainnet` chain object — the chain id itself is never written here),
 * and the parent name comes only from env.
 */

import {
  loadEnsConfig,
  resolveAgent,
  reverseResolve,
  createEnsPublicClient,
  type AgentProfile,
  type EnsConfig,
} from '@actflow/integrations-ens';
import { normalize } from 'viem/ens';
import { isAddress } from '../config/ens';

/**
 * Build an EnsConfig pinned to MAINNET for resolution, independent of the
 * deployment's ENS_CHAIN (which may target Sepolia for writes). Reuses
 * MAINNET_RPC_URL when present; otherwise the integration falls back to viem's
 * public mainnet RPC. The chain id comes from the integration's viem chain
 * mapping for "mainnet" — never hard-coded here.
 */
function mainnetEnsConfig(): EnsConfig {
  return loadEnsConfig({
    ...process.env,
    ENS_CHAIN: 'mainnet',
  });
}

export interface ResolveAgentEnsResult {
  /** The resolved agent ENS profile (text records), if the name resolved. */
  profile: AgentProfile | null;
  /** Address the name forward-resolves to, if any. */
  address: string | null;
  error: string | null;
}

/**
 * Resolve an agent's live ENSIP-26 / ENSIP-5 text records by ENS name on
 * mainnet. Returns a structured result (never throws) so callers can render
 * explicit loading / empty / error states.
 */
export async function resolveAgentEns(name: string): Promise<ResolveAgentEnsResult> {
  const trimmed = name?.trim();
  if (!trimmed) {
    return { profile: null, address: null, error: null };
  }
  try {
    const resolved = await resolveAgent(normalize(trimmed), mainnetEnsConfig());
    return {
      profile: resolved.profile,
      address: resolved.address,
      error: null,
    };
  } catch (err) {
    return {
      profile: null,
      address: null,
      error: err instanceof Error ? err.message : 'ENS resolution failed',
    };
  }
}

export interface EnsNameToAddressResult {
  address: string | null;
  error: string | null;
}

/**
 * Forward-resolve an ENS name to its primary address on mainnet (used by the
 * directory search so an ENS name can be typed instead of a 0x address).
 */
export async function resolveEnsNameToAddress(
  name: string,
): Promise<EnsNameToAddressResult> {
  const trimmed = name?.trim();
  if (!trimmed) return { address: null, error: null };
  try {
    const client = createEnsPublicClient(mainnetEnsConfig());
    const address = await client.getEnsAddress({ name: normalize(trimmed) });
    return { address: address ?? null, error: null };
  } catch (err) {
    return {
      address: null,
      error: err instanceof Error ? err.message : 'ENS resolution failed',
    };
  }
}

export interface ReverseResolveEnsResult {
  /** Primary ENS name for the address, only when forward-verified. */
  name: string | null;
  error: string | null;
}

/**
 * Reverse-resolve a 0x address to its primary ENS name on mainnet, returning
 * the name ONLY when it forward-verifies back to the address (SKILL
 * anti-spoofing requirement). Used server-side (e.g. directory pre-resolution);
 * the client UI uses wagmi's useEnsName for the same effect.
 */
export async function reverseResolveEns(
  address: string,
): Promise<ReverseResolveEnsResult> {
  const trimmed = address?.trim();
  if (!trimmed || !isAddress(trimmed)) {
    return { name: null, error: null };
  }
  try {
    const result = await reverseResolve(
      trimmed as `0x${string}`,
      mainnetEnsConfig(),
    );
    return { name: result.verified ? result.name : null, error: null };
  } catch (err) {
    return {
      name: null,
      error: err instanceof Error ? err.message : 'ENS resolution failed',
    };
  }
}
