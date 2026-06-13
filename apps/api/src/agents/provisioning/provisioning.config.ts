import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration for agent identity provisioning (ENS + ERC-8004 + on-chain binding).
 *
 * EVERYTHING is OPTIONAL so the API boots and provisioning runs DRY-RUN/MOCK-safe with no
 * funds or credentials. The real on-chain binding (AgentIdentityExtension.setIdentity) only
 * activates when BOTH an admin signer key AND the extension contract address are configured.
 *
 * NO hard-coded secrets. NO hard-coded addresses: the ERC-8004 IdentityRegistry address +
 * chain id are resolved INSIDE @actflow/agents from its CITED KNOWN_IDENTITY_REGISTRIES map
 * (erc8004-bigquery skill) and the ENS_/ERC8004_ env vars; this config only carries the
 * optional backend admin signer + the AgentIdentityExtension address (both env-driven).
 *
 * Env mapping (all OPTIONAL):
 *   AGENT_IDENTITY_EXTENSION_ADDRESS - AgentIdentityExtension contract address (binding target)
 *   AGENT_IDENTITY_ADMIN_PRIVATE_KEY - backend admin/owner signer for setIdentityFor (NEVER logged)
 *   AGENT_IDENTITY_RPC_URL           - RPC endpoint for the binding tx (falls back to ARC_TESTNET_RPC_URL)
 *   ARC_TESTNET_RPC_URL              - shared Arc RPC fallback
 *   AGENT_PROVISION_FORCE_DRYRUN     - force the dry-run preview even if a signer is configured
 *   ENS_PARENT_NAME / ENS_CHAIN      - read by @actflow/agents (ENS subname); not required for dry run
 *   ERC8004_IDENTITY_REGISTRY        - read by @actflow/agents (registry override); cited default used otherwise
 *   ERC8004_CHAIN_ID                 - read by @actflow/agents (chain override); default Arc Testnet 5042002
 */
@Injectable()
export class ProvisioningConfig {
  constructor(private readonly configService: ConfigService) {}

  private str(key: string): string | undefined {
    const v = this.configService.get<string>(key);
    return v && v.trim() ? v.trim() : undefined;
  }

  /** AgentIdentityExtension contract address (the on-chain binding target). */
  get identityExtensionAddress(): string | undefined {
    return this.str('AGENT_IDENTITY_EXTENSION_ADDRESS');
  }

  /** Backend admin/owner private key authorized to call setIdentityFor. Never logged. */
  get adminPrivateKey(): string | undefined {
    return this.str('AGENT_IDENTITY_ADMIN_PRIVATE_KEY');
  }

  /** RPC url for the binding tx (AGENT_IDENTITY_RPC_URL, else shared ARC_TESTNET_RPC_URL). */
  get rpcUrl(): string | undefined {
    return this.str('AGENT_IDENTITY_RPC_URL') ?? this.str('ARC_TESTNET_RPC_URL');
  }

  /** Force the labeled dry-run preview even when a signer/contract is present. */
  get forceDryRun(): boolean {
    const v = this.str('AGENT_PROVISION_FORCE_DRYRUN');
    if (!v) return false;
    const t = v.toLowerCase();
    return t === '1' || t === 'true' || t === 'yes' || t === 'on';
  }

  /**
   * Whether a real on-chain binding can be attempted: needs an admin signer, the extension
   * contract address, an RPC url, and not be forced into dry-run. When false, provisioning
   * returns the dry-run identity preview (no funds/creds required).
   */
  get canBindOnChain(): boolean {
    return (
      !this.forceDryRun &&
      !!this.adminPrivateKey &&
      !!this.identityExtensionAddress &&
      !!this.rpcUrl
    );
  }
}
