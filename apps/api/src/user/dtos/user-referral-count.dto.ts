import { IsNotEmpty, IsString } from 'class-validator';

export class UserReferralCountDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}
