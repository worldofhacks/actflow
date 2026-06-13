import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ProvisioningConfig } from './provisioning.config';

/**
 * Minimal ABI fragment for AgentIdentityExtension — the owner-only backend binding write
 * plus the emitted event. Signatures are verbatim from
 * packages/contracts/contracts/AgentIdentityExtension.sol:
 *   setIdentityFor(address agent, bytes32 ensNode, uint256 erc8004Id, string ensName) onlyOwner
 *   event IdentitySet(address indexed agent, bytes32 indexed ensNode, uint256 erc8004Id)
 * NO contract address here — the address is config-driven (AGENT_IDENTITY_EXTENSION_ADDRESS).
 */
const AGENT_IDENTITY_EXTENSION_ABI = [
  'function setIdentityFor(address agent, bytes32 ensNode, uint256 erc8004Id, string ensName)',
  'event IdentitySet(address indexed agent, bytes32 indexed ensNode, uint256 erc8004Id)',
];

/** The exact AgentIdentityExtension.setIdentity args produced by provisionAgent. */
export interface BindIdentityInput {
  /** Agent wallet address whose identity record is bound. */
  agent: string;
  /** namehash(ensName) — bytes32 node. */
  ensNode: string;
  /** ERC-8004 agent id as a decimal string ("" => 0, treated as unset). */
  erc8004Id: string;
  /** Human-readable ENS name (informational on-chain). */
  ensName: string;
}

export interface BindIdentityResult {
  /** 'bound' when setIdentityFor executed on-chain; 'dry-run' for the preview path. */
  status: 'bound' | 'dry-run';
  /** Binding tx hash (real path only). */
  txHash?: string;
  /** Why the dry-run path was taken (no signer/contract/rpc, forced, or missing id). */
  reason?: string;
}

/**
 * Writes the ENS<->ERC-8004 identity binding on-chain via AgentIdentityExtension.setIdentityFor
 * when a configured admin/owner signer + contract address are present. Otherwise returns a
 * labeled DRY-RUN result (no tx, no funds/creds). The DECISION is always real and surfaced to
 * the caller; only the on-chain settlement is optional.
 */
@Injectable()
export class IdentityBindingService {
  private readonly logger = new Logger(IdentityBindingService.name);

  constructor(private readonly config: ProvisioningConfig) {}

  /**
   * Bind (or dry-run) the identity record. Never throws on a live-path failure — it degrades
   * to a labeled dry-run result so provisioning still persists the identity preview.
   */
  async bind(input: BindIdentityInput): Promise<BindIdentityResult> {
    // No real id yet (full dry-run upstream) -> nothing meaningful to bind on-chain.
    const idStr = (input.erc8004Id ?? '').trim();
    const hasRealId = idStr !== '' && idStr !== '0';

    if (!this.config.canBindOnChain) {
      return {
        status: 'dry-run',
        reason: 'no admin signer / extension address / rpc configured (mock-safe preview)',
      };
    }
    if (!hasRealId) {
      // A live binding needs a minted ERC-8004 id; without one we leave it as a preview.
      return {
        status: 'dry-run',
        reason: 'no on-chain ERC-8004 id available to bind yet',
      };
    }
    if (!ethers.isAddress(input.agent)) {
      return { status: 'dry-run', reason: `invalid agent address: ${input.agent}` };
    }

    try {
      const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      const wallet = new ethers.Wallet(this.config.adminPrivateKey as string, provider);
      const contract = new ethers.Contract(
        this.config.identityExtensionAddress as string,
        AGENT_IDENTITY_EXTENSION_ABI,
        wallet,
      );
      const tx = await contract.setIdentityFor(
        input.agent,
        input.ensNode,
        BigInt(idStr),
        input.ensName,
      );
      const receipt = await tx.wait();
      const txHash = receipt?.hash ?? tx.hash;
      this.logger.log(
        `bound identity for ${input.agent} (erc8004Id=${idStr}) in tx ${txHash}`,
      );
      return { status: 'bound', txHash };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `on-chain identity binding failed for ${input.agent}; returning dry-run preview: ${reason}`,
      );
      return { status: 'dry-run', reason: `binding tx failed: ${reason}` };
    }
  }
}
