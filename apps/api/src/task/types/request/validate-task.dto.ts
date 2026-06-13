import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ValidateTaskDto {
  @IsString()
  @IsNotEmpty()
  fromWallet: string;

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @IsString()
  @IsNotEmpty()
  result: string;
}
