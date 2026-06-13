import { Body, Controller, Post } from '@nestjs/common';
import { ProvisionAgentRequestDto } from './dto/provision-agent.dto';
import { ProvisioningService, ProvisionResultView } from './provisioning.service';

@Controller('agents')
export class ProvisioningController {
  constructor(private readonly provisioning: ProvisioningService) {}

  /**
   * POST /agents/provision
   *
   * Provision a complete ENS + ERC-8004 identity for an EXISTING agent. Locates the agent,
   * calls @actflow/agents provisionAgent (ERC-8004 register + ENS subname/records) and, when a
   * configured admin/owner signer is present, writes AgentIdentityExtension.setIdentity on-chain;
   * otherwise returns the labeled dry-run identity preview. Persists ensName/ensNode/erc8004Id
   * on the agent record and returns the full provisioning result.
   *
   * DRY-RUN / MOCK-safe: with no ENS/ERC-8004 env + no admin signer this returns a preview and
   * sends no on-chain tx (no funds/creds required).
   */
  @Post('provision')
  async provision(@Body() dto: ProvisionAgentRequestDto): Promise<ProvisionResultView> {
    return this.provisioning.provision({
      agentId: dto.agentId,
      slug: dto.slug,
      endpoint: dto.endpoint,
      agentURI: dto.agentURI,
      x402: dto.x402,
    });
  }
}
