import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class CreateUserDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsOptional()
  @IsString()
  referrer: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
// Makes all fields optional
// (Phyllo / invitation-code fields were removed during the monorepo port.)
export class UpdateUserDto extends PartialType(CreateUserDTO) {
  @IsOptional()
  @IsString()
  referralCode: string;

  /**
   * Whether the user's email has been verified
   */
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  /**
   * The date when the user's email was verified
   */
  @IsOptional()
  @IsDateString()
  emailVerifiedAt?: Date;
}
