import { RegisterAgentParams } from '../../contracts';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AgentMetadata } from '../../agents/core/agent-metadata';
import { AgentTopicMapper } from '../../agents/mappers/agent-topic.mapper';
import { AgentMetadataService } from '../../agents/services/agent-metadata.service';
import { AgentService } from '../../agents/services/agent.service';
import { CreateAgentDto } from '../../agents/types/request/create-agent.dto';
import { AgentBalanceApiResponse } from '../../agents/types/response/agent-details.response';
import { CreateAgentResponse as CreateAgentApiResponse } from '../../agents/types/response/create-agent.response';
import { RetryService } from '../../common/retry.service';
import { ContractsConfig } from '../../marketplace/config/contracts.config';
import { ContractClient } from '../../marketplace/market.rpc.client';

@Injectable()
export class FacadeAgentService {
  private readonly logger = new Logger(FacadeAgentService.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly agentMetadataService: AgentMetadataService,
    private readonly config: ContractsConfig,
    private readonly blockchainRetry: RetryService,
  ) {}

  async registerNewAgent(
    userId: string,
    walletAddress: string,
    agentData: CreateAgentDto,
  ): Promise<CreateAgentApiResponse> {
    this.logger.log('registerNewAgent', userId, walletAddress, agentData);
    const userPrivateKey = await this.agentService.getUserWalletPrivateKey(userId, walletAddress);
    const metadataModel = new AgentMetadata(agentData.metadata);
    const savedMetadata = await this.agentMetadataService.saveMetadata(metadataModel);

    const skills = AgentTopicMapper.dtoArrayToMarketLib(agentData.skills, agentData.topic);
    const rpcParams: RegisterAgentParams = {
      metadata: savedMetadata._id.toString(),
      topics: skills.map(skill => skill.metadata),
      topicsData: skills,
    };

    const signer = this.getSigner(userPrivateKey);
    const result = await signer.registerAgent(rpcParams);
    this.logger.log('registerNewAgent', 'contract-result', result);
    if (!result) {
      throw new InternalServerErrorException('Failed to register agent on blockchain');
    }

    const creationTransaction = {
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      transactionIndex: undefined,
      logIndex: undefined,
      processedAt: undefined,
    };

    const savedAgent = await this.agentService.savePendingAgent(
      {
        agentId: result.agentId,
        metadataId: savedMetadata._id.toString(),
        topic: agentData.topic,
        skills: AgentTopicMapper.dtoArrayToDocument(agentData.skills, agentData.topic),
        creationTransaction: creationTransaction,
        isMetadataDefault: false,
        isBlockchainConfirmed: false,
      },
      new AgentMetadata(savedMetadata),
    );

    return {
      id: savedAgent._id.toString(),
      agentId: result.agentId,
      transactionHash: result.transactionHash,
    };
  }

  async getAgentBalances(agentId: string): Promise<AgentBalanceApiResponse> {
    const client = this.getReadOnlyClient();
    const agent = await client.aggregate(agentId);

    return {
      balance: agent.balance.toString(),
      pending: agent.locked.toString(),
      total: (agent.balance + agent.locked).toString(),
      nativeBalance: agent.nativeBalance.toString(),
      rvTokenBalance: agent.rvTokenBalance.toString(),
    };
  }

  private getSigner(userPrivateKey: string): ContractClient {
    return ContractClient.createSigner(userPrivateKey, this.config, this.blockchainRetry);
  }

  private getReadOnlyClient(): ContractClient {
    return ContractClient.createClientReadOnly(this.config, this.blockchainRetry);
  }

  // private async fetchUrlAnalyticsViaEnsamble(socialUrl: string) {
  //   let analytics = null;
  //   try {
  //     if (socialUrl) {
  //       const urlParser = SocialUrlParser.parseAny(socialUrl);
  //       if (urlParser && urlParser.username) {
  //         const socialData = await this.ensambleService.getTwitterUserInfo(urlParser.username);
  //         if (socialData?.data?.legacy) {
  //           analytics = new SocialAnalytics({
  //             followers: socialData.data.legacy.followers_count,
  //             following: socialData.data.legacy.friends_count,
  //             totalPosts: socialData.data.legacy.statuses_count,
  //             isVerified: socialData.data.is_blue_verified,
  //             lastUpdated: new Date(),
  //           });
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.warn(`Failed to fetch social data: ${error.message}`);
  //   }
  //   return analytics;
  // }
}
