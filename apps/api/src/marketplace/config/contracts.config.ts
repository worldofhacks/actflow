import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Chain + deployment configuration for the ACT marketplace contract.
 * (Formerly `StoryProtocolConfig`; the Story Protocol module/registry getters and the
 * RabbitMQ getter were removed when the backend was ported into the monorepo.)
 */
@Injectable()
export class ContractsConfig {
  constructor(private configService: ConfigService) {}

  get network() {
    return {
      rpcUrl: this.configService.getOrThrow('NETWORK_RPC_URL'),
      chainId: parseInt(this.configService.getOrThrow('CHAIN_ID'), 10),
    };
  }

  get deployment() {
    return {
      ACT_MARKET_ADDRESS: this.configService.getOrThrow('ACT_MARKET_ADDRESS'),
      REVENUE_TOKEN: this.configService.getOrThrow('REVENUE_TOKEN_ADDRESS'),
    };
  }

  /**
   * Optional contract-owner key for explicit admin operations only.
   * Must NEVER be used as an implicit fallback signer for user actions
   * (the old ContractClient constructor fallback was removed on purpose).
   */
  get contractOwnerKey(): string | undefined {
    return this.configService.get<string>('CONTRACT_OWNER_KEY');
  }
}
