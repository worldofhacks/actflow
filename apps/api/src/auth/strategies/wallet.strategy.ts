import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserDocument } from '../../user/schemas/user.schema';
import { AuthService } from '../auth.service';

/**
 * SIWE-style wallet strategy: the body carries the wallet address plus a signature over
 * the single-use nonce message issued by POST /auth/wallet/nonce. The signature is
 * verified before any JWT is issued.
 */
@Injectable()
export class WalletStrategy extends PassportStrategy(Strategy, 'wallet') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'address',
      passwordField: 'signature',
    });
  }

  async validate(address: string, signature: string): Promise<UserDocument> {
    try {
      const user = await this.authService.validateWallet(address, signature);
      if (!user) throw new UnauthorizedException('User not found with this Information');
      return user;
    } catch (error) {
      throw new UnauthorizedException(error.message ?? 'Wallet authentication failed');
    }
  }
}
