import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class SocialAccountDto {
  @IsString()
  access_token: string;

  @IsString()
  refresh_token: string;

  @IsString()
  id: string;

  @IsString()
  username: string;

  @IsString()
  platform: string;

  @IsDate()
  @Type(() => Date)
  connected_at: Date;

  @IsNumber()
  interactions: number;
}

export class LinkedAccountsDto {
  @IsOptional()
  @IsObject()
  twitter?: SocialAccountDto | null;

  @IsOptional()
  @IsObject()
  instagram?: SocialAccountDto | null;

  @IsOptional()
  @IsObject()
  google?: SocialAccountDto | null;
}
