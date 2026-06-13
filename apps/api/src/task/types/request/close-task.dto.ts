import { ArrayNotEmpty, IsArray, IsBoolean, IsString } from 'class-validator';

export class CloseTasksDto {
  @IsString()
  fromWallet: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  taskIds: string[];

  @IsBoolean()
  withdraw: boolean;
}
