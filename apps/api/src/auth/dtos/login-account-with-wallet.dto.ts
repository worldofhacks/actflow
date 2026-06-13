import { IsNotEmpty, IsString } from 'class-validator';

export class LoginAccountWithWalletDTO {
  @IsNotEmpty()
  @IsString()
  address: string;

  /**
   * Signature over the SIWE-style nonce message issued by POST /auth/wallet/nonce.
   */
  @IsNotEmpty()
  @IsString()
  signature: string;
}
