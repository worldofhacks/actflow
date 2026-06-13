import { IsOptional, IsString } from 'class-validator';

export class UpdateUserWalletDTO {
  @IsOptional()
  @IsString()
  name?: string; // Wallet private key (will be encrypted)

  @IsOptional()
  @IsString()
  address?: string; // Wallet public address

  @IsOptional()
  @IsString()
  privateKey?: string; // Wallet private key (will be encrypted)
}
