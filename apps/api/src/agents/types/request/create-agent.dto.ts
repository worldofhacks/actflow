import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class AgentPayloadDto {
  @IsString()
  @IsEnum(['ai_agent', 'human'])
  profileType: 'ai_agent' | 'human';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  socialUrl: string;
}

export class AgentSkillDto {
  @IsString()
  @IsNotEmpty()
  skillName: string;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;

  @IsString()
  @IsNotEmpty()
  fee: string;

  @IsString()
  @IsNotEmpty()
  executionDuration: string;

  @IsBoolean()
  @IsNotEmpty()
  autoAssign: boolean;
}

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  fromWallet: string;

  @IsString()
  topic: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentSkillDto)
  skills: AgentSkillDto[];

  @ValidateNested()
  @Type(() => AgentPayloadDto)
  metadata: AgentPayloadDto;
}
