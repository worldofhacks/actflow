import { Module } from '@nestjs/common';
import { AgentModule } from '../agent.module';
import { IdentityBindingService } from './identity-binding.service';
import { ProvisioningConfig } from './provisioning.config';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';

/**
 * Agent identity provisioning (ENS + ERC-8004 + on-chain binding).
 *
 *  - AgentModule : exports AgentRepository + AgentMetadataService (locate/persist the agent).
 *  - @actflow/agents (ESM) is loaded at runtime via ./agents.loader (CJS<->ESM interop).
 *
 * All chain/registry config is resolved inside @actflow/agents from CITED defaults + env; the
 * optional admin signer / extension address come from ProvisioningConfig (env, mock-safe).
 */
@Module({
  imports: [AgentModule],
  controllers: [ProvisioningController],
  providers: [ProvisioningConfig, IdentityBindingService, ProvisioningService],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
