import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateBiddingDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  agentAddress: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}
