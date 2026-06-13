import { MarketLibAgentTopic } from '../../contracts/market.types';
import { ethers } from 'ethers';
import { AgentTopicSkill } from '../core/agent-topic';
import { AgentSkillDocument } from '../schemas/agent-metadata.schema';
import { AgentSkillDto } from '../types/request/create-agent.dto';

export class AgentTopicMapper {
  static dtoArrayToMarketLib(dtos: AgentSkillDto[], topicName: string): MarketLibAgentTopic[] {
    return dtos.map(dto => ({
      enabled: dto.enabled,
      fee: ethers.parseEther(dto.fee), // Convert string to BigInt for TokenAmount
      executionDuration: Number(dto.executionDuration),
      metadata: `${topicName}:${dto.skillName}`,
      autoAssign: dto.autoAssign,
    }));
  }

  static marketLibArrayToDto(marketTopics: MarketLibAgentTopic[]): AgentSkillDto[] {
    return marketTopics.map(topic => ({
      enabled: topic.enabled,
      fee: topic.fee.toString(), // Convert BigInt to string
      executionDuration: topic.executionDuration.toString(),
      skillName: topic.metadata,
      autoAssign: topic.autoAssign,
    }));
  }

  static documentArrayToMarketLib(docs: AgentSkillDocument[]): MarketLibAgentTopic[] {
    return docs.map(doc => ({
      enabled: doc.enabled,
      fee: BigInt(doc.fee), // Convert number to BigInt
      executionDuration: doc.executionDuration,
      metadata: doc.skillName,
      autoAssign: doc.autoAssign,
    }));
  }

  static marketLibArrayToDocument(marketTopics: MarketLibAgentTopic[]): AgentSkillDocument[] {
    return marketTopics.map(topic => ({
      enabled: topic.enabled,
      fee: topic.fee.toString(),
      executionDuration: Number(topic.executionDuration),
      skillName: topic.metadata,
      autoAssign: topic.autoAssign,
    }));
  }

  static dtoArrayToDocument(dtos: AgentSkillDto[], topicName: string): AgentSkillDocument[] {
    return dtos.map(dto => ({
      enabled: dto.enabled,
      fee: dto.fee,
      executionDuration: Number(dto.executionDuration),
      skillName: `${topicName}:${dto.skillName}`,
      autoAssign: dto.autoAssign,
    }));
  }

  static documentArrayToDto(docs: AgentSkillDocument[]): AgentSkillDto[] {
    return docs.map(doc => ({
      enabled: doc.enabled,
      fee: doc.fee.toString(), // Convert number to string
      executionDuration: doc.executionDuration.toString(),
      skillName: doc.skillName,
      autoAssign: doc.autoAssign,
    }));
  }

  static documentArrayToDomain(docs: AgentSkillDocument[]): AgentTopicSkill[] {
    return docs.map(doc => ({
      enabled: doc.enabled,
      fee: doc.fee,
      executionDuration: doc.executionDuration,
      skillName: doc.skillName,
      autoAssign: doc.autoAssign,
    }));
  }
}
