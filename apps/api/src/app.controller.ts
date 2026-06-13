import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { ContractsConfig } from './marketplace/config/contracts.config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly marketplaceConfig: ContractsConfig,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }

  @Get('config')
  config() {
    return {
      REVENUE_TOKEN: this.marketplaceConfig.deployment.REVENUE_TOKEN,
      MARKETPLACE_CONTRACT: this.marketplaceConfig.deployment.ACT_MARKET_ADDRESS,
      NETWORK_RPC_URL: this.marketplaceConfig.network.rpcUrl,
      CHAIN_ID: this.marketplaceConfig.network.chainId,
      NODE_ENV: this.configService.get('NODE_ENV'),
      LAST_DEPLOY: this.configService.get('LAST_DEPLOY'),
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
