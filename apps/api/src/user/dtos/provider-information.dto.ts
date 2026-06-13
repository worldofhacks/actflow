import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProviderDto {
  @IsString()
  @IsNotEmpty()
  type: ProviderType;

  /**
   * will be available only for @type {ProviderType.GOOGLE}
   */
  @IsString()
  @IsOptional()
  image?: string;

  /**
   * will be available only for @type {ProviderType.WALLET} will be the wallet address, and this address will be hashed so be careful while updating and reading
   */
  @IsString()
  @IsOptional()
  address?: string;

  /**
   * will be available for some of the providers like @type {ProviderType.GOOGLE, ProviderType.TWITTER, ProviderType.TELEGRAM}
   */
  @IsString()
  @IsOptional()
  access_token?: string;

  /**
   * will be available for some of the providers like @type {ProviderType.GOOGLE, ProviderType.TWITTER, ProviderType.TELEGRAM}
   */
  @IsString()
  @IsOptional()
  refresh_token?: string;

  /**
   * will be available @type {ProviderType.TWITTER}
   */
  @IsString()
  @IsOptional()
  twitterUserId?: string;
}

export enum ProviderType {
  GOOGLE = 'google',
  CREDENTIALS = 'credentials',
  TWITTER = 'twitter',
  WALLET = 'wallet',
  TELEGRAM = 'telegram',
}
