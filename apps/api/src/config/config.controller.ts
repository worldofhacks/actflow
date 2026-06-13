// config/config.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ContractConfigService } from './service/contract.config.service';

@Controller('config')
export class ContractConfigController {
  constructor(private readonly configService: ContractConfigService) {}

  @Get('contract')
  @UseGuards(JwtAuthGuard)
  getContractConfig() {
    return this.configService.getLatestConfig();
  }
}
