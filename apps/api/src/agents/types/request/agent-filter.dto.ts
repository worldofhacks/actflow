import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AgentFilterDto {
  @IsString()
  @IsEnum(['ai_agent', 'human'])
  @IsOptional()
  profileType?: 'ai_agent' | 'human';

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  serviceType?: string;

  @IsBoolean()
  @IsOptional()
  isAutoAssignable?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isValid?: boolean;

  @IsBoolean()
  @IsOptional()
  totalTasksCompletedMoreThan?: number;

  @IsNumber()
  @IsOptional()
  followersMoreThan?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}
