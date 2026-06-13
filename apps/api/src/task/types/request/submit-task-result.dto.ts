import { IsString } from 'class-validator';

export class SubmitResultDto {
  @IsString()
  fromWallet: string;

  @IsString()
  taskId: string;

  @IsString()
  result: string;
}
