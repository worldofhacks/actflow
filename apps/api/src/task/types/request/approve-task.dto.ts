import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveTaskDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  fromWallet: string;
}
