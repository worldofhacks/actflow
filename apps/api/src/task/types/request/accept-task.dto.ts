import { IsNumber, IsString } from 'class-validator';

export class AcceptTaskDto {
  @IsString()
  fromWallet: string;

  @IsString()
  taskId: string;

  @IsString()
  reward: string; // Even though deprecated, still needed as the 2nd parameter

  @IsNumber()
  executionDuration: number;
}
