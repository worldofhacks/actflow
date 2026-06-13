import { IsNotEmpty, IsString } from 'class-validator';

export class CheckWalletExistsDTO {
  @IsNotEmpty()
  @IsString()
  address: string;
}
