import { IsNotEmpty, IsString } from 'class-validator';

export class WalletNonceDTO {
  @IsNotEmpty()
  @IsString()
  address: string;
}
