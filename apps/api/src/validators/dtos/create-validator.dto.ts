import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateValidatorDto {
  @IsString()
  @IsNotEmpty()
  fromWallet: string;

  @IsString()
  @IsNotEmpty()
  metadata: string;

  @IsNumber()
  @IsOptional()
  expireAtTs?: number;

  @IsArray()
  @IsOptional()
  topics?: string[];
}
