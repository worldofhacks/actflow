import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AgentRepository } from '../repository/agent.repository';
import { AgentMetadataService } from '../services/agent-metadata.service';
import { loadAgents, ProvisionAgentResult } from './agents.loader';
import { IdentityBindingService } from './identity-binding.service';
import { ProvisioningConfig } from './provisioning.config';

export interface ProvisionAgentParams {
  /** Existing agent identifier: wallet address (0x...) OR mongo id. Required. */
  agentId: string;
  /** Optional explicit slug (kebab) for the ENS subname; defaults from metadata name. */
  slug?: string;
  /** Optional agent endpoint URL (ENSIP-26 + ERC-8004 agentURI default). */
  endpoint?: string;
  /** Optional ERC-8004 registration metadata URI; defaults to endpoint. */
  agentURI?: string;
  /** Whether the agent accepts x402 USDC payments (ENS record). */
  x402?: boolean;
}

/** The provisioning result returned to the frontend + persisted on the agent record. */
export interface ProvisionResultView {
  /** Mongo id of the agent record updated. */
  id: string;
  /** Agent wallet address (ERC-8004 NFT owner / identity subject). */
  agentAddress: string;
  /** Full ENS name `<slug>.<parent>` (or bare slug when ENS_PARENT_NAME unset). */
  ensName: string;
  /** namehash(ensName) — bytes32 node bound via AgentIdentityExtension. */
  ensNode: string;
  /** ERC-8004 IdentityRegistry agent id (decimal string) when known. */
  erc8004Id?: string;
  /** ERC-8004 IdentityRegistry address used (cited default unless overridden). */
  registryAddress?: string;
  /** ERC-8004 chain id targeted (default Arc Testnet 5042002). */
  chainId: number;
  /** The ENS text records written (or would-be written in dry run). */
  records: Array<[string, string]>;
  /** The exact AgentIdentityExtension.setIdentity args. */
  identityExtensionCall: { ensNode: string; erc8004Id: string; ensName: string };
  /**
   * Identity binding status:
   *  - 'dry-run' : preview only (no funds/creds) — NOT recorded on-chain.
   *  - 'bound'   : setIdentity executed on-chain (tx in `bindingTxHash`).
   */
  identityStatus: 'dry-run' | 'bound';
  /** Binding tx hash, when the on-chain binding executed. */
  bindingTxHash?: string;
  /** true when provisionAgent itself was a dry run (no ENS mint / ERC-8004 register tx). */
  provisionDryRun: boolean;
  /** Human note about why a dry run / preview was returned (when applicable). */
  note?: string;
}

/**
 * Agent identity provisioning: after locating an existing agent record, calls
 * @actflow/agents provisionAgent (ERC-8004 register + ENS subname/records) and, when a
 * configured admin/owner signer is present, writes AgentIdentityExtension.setIdentity on-chain;
 * otherwise returns the dry-run identity preview. The resulting ensName/ensNode/erc8004Id are
 * persisted on the agent record and the full result is returned to the frontend.
 *
 * FULLY DRY-RUN / MOCK-safe: with no ENS/ERC-8004 env + no admin signer, provisionAgent
 * returns a labeled preview and no on-chain tx is sent. No funds/creds required.
 */
@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly agentMetadataService: AgentMetadataService,
    private readonly binding: IdentityBindingService,
    private readonly config: ProvisioningConfig,
  ) {}

  /** kebab-case a free-form name/string into a DNS-safe ENS label. */
  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63);
  }

  private isAddress(v: string): v is `0x${string}` {
    return /^0x[0-9a-fA-F]{40}$/.test(v);
  }

  /** Locate the agent record by wallet address (0x...) or mongo id. */
  private async findAgent(agentId: string) {
    const isAddr = agentId.startsWith('0x');
    const agent = isAddr
      ? await this.agentRepository.findByAgentId(agentId)
      : await this.agentRepository.findById(agentId).catch(() => null);
    if (!agent) {
      throw new NotFoundException(`Agent not found: ${agentId}`);
    }
    return agent;
  }

  /**
   * Provision (or dry-run) a complete ENS + ERC-8004 identity for an existing agent.
   */
  async provision(params: ProvisionAgentParams): Promise<ProvisionResultView> {
    if (!params.agentId || !params.agentId.trim()) {
      throw new BadRequestException('agentId (wallet 0x... or mongo id) is required.');
    }

    const agent = await this.findAgent(params.agentId);
    const agentAddress = agent.agentId;
    if (!this.isAddress(agentAddress)) {
      throw new BadRequestException(
        `Agent ${agent._id} has no valid wallet address (agentId=${agentAddress}); cannot provision identity.`,
      );
    }

    // Derive the ENS slug: explicit param > metadata name > address tail.
    let slug = params.slug?.trim();
    if (!slug) {
      try {
        const metadata = await this.agentMetadataService.getMetadataByAgentId(agentAddress);
        if (metadata?.name) slug = this.slugify(metadata.name);
      } catch {
        // metadata optional for slug derivation
      }
    }
    if (!slug) slug = this.slugify(`agent-${agentAddress.slice(2, 10)}`);

    // Call provisionAgent (ESM, dynamic import). Pass null wallet clients -> dry-run for the
    // ENS mint + ERC-8004 register sub-steps; @actflow/agents resolves the cited registry +
    // chain id from its own config/env. The on-chain BINDING is handled separately below so a
    // configured admin signer can record setIdentity even when the sub-steps were dry-run.
    const agents = await loadAgents();
    let result: ProvisionAgentResult;
    try {
      result = await agents.provisionAgent(
        {
          slug,
          address: agentAddress,
          endpoint: params.endpoint,
          agentURI: params.agentURI,
          x402: params.x402,
        },
        { walletClient: null },
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(`provisionAgent failed for ${agentAddress}: ${reason}`);
      throw new BadRequestException(`Provisioning failed: ${reason}`);
    }

    // On-chain binding (optional): write setIdentity when an admin signer + contract exist.
    const bind = await this.binding.bind({
      agent: agentAddress,
      ensNode: result.identityExtensionCall.ensNode,
      erc8004Id: result.identityExtensionCall.erc8004Id,
      ensName: result.identityExtensionCall.ensName,
    });

    // Persist the resolved identity on the agent record.
    await this.agentRepository.update(agent._id.toString(), {
      ensName: result.ensName,
      ensNode: result.ensNode,
      ...(result.erc8004Id ? { erc8004Id: result.erc8004Id } : {}),
      identityStatus: bind.status,
    });

    const note =
      bind.status === 'dry-run'
        ? bind.reason ??
          'identity preview only — set AGENT_IDENTITY_ADMIN_PRIVATE_KEY + AGENT_IDENTITY_EXTENSION_ADDRESS (+RPC) to bind on-chain.'
        : undefined;

    return {
      id: agent._id.toString(),
      agentAddress,
      ensName: result.ensName,
      ensNode: result.ensNode,
      erc8004Id: result.erc8004Id,
      registryAddress: result.erc8004.registryAddress,
      chainId: result.erc8004.chainId,
      records: result.records,
      identityExtensionCall: result.identityExtensionCall,
      identityStatus: bind.status,
      bindingTxHash: bind.txHash,
      provisionDryRun: result.dryRun,
      note,
    };
  }
}
