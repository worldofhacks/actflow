import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserDocument } from '../../user/schemas/user.schema';
import { AuthService } from '../auth.service';
// LocalStrategy is a strategy that validates the user's credentials on login
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly requireEmailVerification: boolean;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      usernameField: 'email',
    });

    // Read from config if email verification is required for login
    this.requireEmailVerification =
      this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION') === 'true';
  }

  async validate(email: string, password: string): Promise<UserDocument> {
    try {
      // Use the new validation method that checks email verification
      const user = await this.authService.validateUserWithVerification(
        email,
        password,
        this.requireEmailVerification,
      );
      return user;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
