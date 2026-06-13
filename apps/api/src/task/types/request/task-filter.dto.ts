import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TaskFilterDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  state?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  creatorWallets?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedAgents?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  invitedAgents?: string[];

  @IsOptional()
  @IsString()
  topic?: string; //was enum

  @IsOptional()
  @IsBoolean()
  validationEligible?: boolean;

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
