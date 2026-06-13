/**
 * Client-safe display config for ERC-8004 agent identity in the provisioning UI.
 *
 * RULES (ERC-8004 judges): the web app NEVER invents registry addresses or chain
 * ids. The ERC-8004 IdentityRegistry address + chain id come VERBATIM from the
 * `POST /agents/provision` response (`registryAddress` / `chainId`), which the
 * API resolves from @actflow/agents' cited KNOWN_IDENTITY_REGISTRIES map
 * (erc8004-bigquery skill). This module only turns those API-provided values into
 * human-readable labels and block-explorer links — it embeds NO registry address.
 *
 * Cited registry addresses (for reference only — NOT used to build calls here;
 * the API/@actflow/agents is the source of truth, erc8004-bigquery skill):
 *   - Ethereum mainnet (chainId 1) IdentityRegistry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
 *   - Testnets (incl. Arc Testnet 5042002) IdentityRegistry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
 * We do NOT hard-code these into any on-chain interaction; we render whatever
 * `registryAddress` the API returns.
 */

import { ARC_TESTNET_CHAIN_ID, ARC_TESTNET_EXPLORER_URL } from '@actflow/sdk';

/** Arc testnet chain id (config-driven, from the SDK — never a literal). */
export const ARC_CHAIN_ID = ARC_TESTNET_CHAIN_ID;

/**
 * Arc block-explorer base. Mirrors lib/config/arc.ts: defaults to the SDK's
 * documented ArcScan testnet base, overridable per-deployment via
 * NEXT_PUBLIC_ARC_EXPLORER_URL. Defined here (importing the SDK directly rather
 * than ./arc) so this module has no extensionless relative import.
 */
export const ARC_EXPLORER_BASE = (
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || ARC_TESTNET_EXPLORER_URL
).replace(/\/+$/, '');

/**
 * Block-explorer base URL for a given ERC-8004 chain id, so a provisioned
 * registry address / binding tx can be linked out. Config-driven:
 *   - Arc Testnet uses the same ArcScan base the payments flow already reads
 *     (NEXT_PUBLIC_ARC_EXPLORER_URL, default ArcScan testnet).
 *   - Other chains can be supplied via NEXT_PUBLIC_ERC8004_EXPLORER_URL.
 * Returns undefined when no explorer base is configured for the chain, so the UI
 * shows the address/id as plain text rather than a broken link.
 */
export function erc8004ExplorerBase(chainId: number): string | undefined {
  if (chainId === ARC_CHAIN_ID) return ARC_EXPLORER_BASE;
  const override = process.env.NEXT_PUBLIC_ERC8004_EXPLORER_URL?.trim();
  return override ? override.replace(/\/+$/, '') : undefined;
}

/** Explorer URL for an address (registry / agent) on the given chain, if known. */
export function erc8004AddressUrl(chainId: number, address: string): string | undefined {
  const base = erc8004ExplorerBase(chainId);
  return base ? `${base}/address/${address}` : undefined;
}

/** Explorer URL for a binding tx hash on the given chain, if known. */
export function erc8004TxUrl(chainId: number, txHash: string): string | undefined {
  const base = erc8004ExplorerBase(chainId);
  return base ? `${base}/tx/${txHash}` : undefined;
}

/** Human label for a chain id (Arc Testnet is named; others fall back to the id). */
export function chainLabel(chainId: number): string {
  if (chainId === ARC_CHAIN_ID) return `Arc Testnet (${chainId})`;
  return `Chain ${chainId}`;
}
