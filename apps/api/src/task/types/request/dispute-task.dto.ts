import { IsNotEmpty, IsString } from 'class-validator';

export class DisputeTaskDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  fromWallet: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
