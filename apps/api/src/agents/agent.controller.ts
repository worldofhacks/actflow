import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FacadeAgentService } from '../domain/agent/facade.agent.service';
import { User } from '../user/decorators/user.decorator';
import { AgentMetadataMapper } from './mappers/agent-metadata.mapper';
import { AgentMapper } from './mappers/agent.mapper';
import { AgentMetadataService } from './services/agent-metadata.service';
import { AgentService } from './services/agent.service';
import { AgentFilterDto } from './types/request/agent-filter.dto';
import { CreateAgentDto } from './types/request/create-agent.dto';
import { AgentDetailsApiResponse } from './types/response/agent-details.response';
import { AgentMetadataResponse } from './types/response/agent-metadata.response';
import { CreateAgentResponse } from './types/response/create-agent.response';

@Controller('agents')
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly agentMetadataService: AgentMetadataService,
    private readonly agentFacade: FacadeAgentService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-agent')
  async registerAgent(
    @User() user: any,
    @Body() agentData: CreateAgentDto,
  ): Promise<CreateAgentResponse> {
    return this.agentFacade.registerNewAgent(user._id, agentData.fromWallet, agentData);
  }

  @Post('search')
  async searchAgents(@Body() filterDto: AgentFilterDto): Promise<AgentDetailsApiResponse[]> {
    const agents = await this.agentService.searchAgents(filterDto);
    const agentBalances = await Promise.all(
      agents.map(agent => this.agentFacade.getAgentBalances(agent.agentId)),
    );
    return agents.map((agent, index) => AgentMapper.toDetailedView(agent, agentBalances[index]));
  }

  @Get('featured-agents')
  async getFeaturesAgents() {
    const agents = await this.agentService.getFeaturedAgents();
    const agentBalances = await Promise.all(
      agents.map(agent => this.agentFacade.getAgentBalances(agent.agentId)),
    );
    return agents.map((agent, index) => AgentMapper.toDetailedView(agent, agentBalances[index]));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-agents')
  async getMyAgents(@User() user: any) {
    const agents = await this.agentService.getAgentsByUser(user._id);
    return agents.map(agent => AgentMapper.toDetailedView(agent));
  }
  @Get(':agentAddress/metadata')
  async getAgentMetadata(
    @Param('agentAddress') agentAddress: string,
  ): Promise<AgentMetadataResponse> {
    const metadata = await this.agentMetadataService.getMetadataByAgentId(agentAddress);
    return AgentMetadataMapper.mapToApiResponse(metadata);
  }

  @Get(':agentAddress')
  async getAgentById(
    @Param('agentAddress') agentAddress: string,
  ): Promise<AgentDetailsApiResponse> {
    if (agentAddress.startsWith('0x')) {
      const agent = await this.agentService.findPopulatedByAgentId(agentAddress);
      const balance = await this.agentFacade.getAgentBalances(agentAddress);
      return AgentMapper.toDetailedView(agent, balance);
    } else {
      const agent = await this.agentService.findPopulatedById(agentAddress);
      const balance = await this.agentFacade.getAgentBalances(agent.agentId);
      return AgentMapper.toDetailedView(agent, balance);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':agentAddress/update-last-online')
  async updateLastOnlineStatus(
    @Param('agentAddress') agentAddress: string,
    @Body() data: { instanceId?: string; lastProcessedBlock?: number },
  ) {
    return await this.agentService.updateLastOnline(
      agentAddress,
      data.instanceId,
      data.lastProcessedBlock,
    );
  }
}
