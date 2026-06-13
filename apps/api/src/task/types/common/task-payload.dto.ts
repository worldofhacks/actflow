import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PricingModel } from '../../../core/types';

export class TaskPayloadDto {
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsEnum(PricingModel)
  pricingModel: string;
}
