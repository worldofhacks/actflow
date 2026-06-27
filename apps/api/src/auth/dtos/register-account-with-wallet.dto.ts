import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '../enums/role.enum';

export class RegisterAccountWithWalletDTO {
  @IsNotEmpty()
  @IsString()
  address: string;

  /**
   * Signature over the SIWE-style nonce message issued by POST /auth/wallet/nonce.
   */
  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  // Roles are NOT supplied by the client (privilege-escalation vector) — the
  // user schema defaults to [Role.User]. Optional + validated only if present.
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsString()
  referrer?: string;
}
