import { Body, Controller, Get, Post, Request, UseFilters, UseGuards } from '@nestjs/common';

import { MongoExceptionFilter } from '../common/filters/mongo-exception.filter';
import { CreateUserDTO } from '../user/dtos/create-user.dto';
import { ForgotPasswordDTO } from '../user/dtos/forgot-password.dto';
import { ResetPasswordDTO } from '../user/dtos/reset-password.dto';
import { UserService } from '../user/services/user.service';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { CheckWalletExistsDTO } from './dtos/check-wallet-exists.dto';
import { LoginAccountWithWalletDTO } from './dtos/login-account-with-wallet.dto';
import { RegisterAccountWithWalletDTO } from './dtos/register-account-with-wallet.dto';
import { WalletNonceDTO } from './dtos/wallet-nonce.dto';
import { Role } from './enums/role.enum';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LocalAuthGuard } from './guards/local.guard';
import { RolesGuard } from './guards/roles.guard';
import { WalletAuthGuard } from './guards/wallet.guard';

// Endpoints removed during the monorepo port:
// - /verify-email, /resend-verification (email module dropped)
// - /google/callback, /twitter/callback, /telegram/callback (reintroduce only with a
//   proper server-side OAuth flow)
// - Phyllo endpoints (pre-pivot influencer integrations)
@Controller('auth')
@UseFilters(MongoExceptionFilter)
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('/register')
  async register(@Body() createUserDTO: CreateUserDTO) {
    const user = await this.authService.register(createUserDTO);
    return user;
  }

  /**
   * @description check if the wallet account exists in our database
   */
  @Post('/wallet/check')
  async walletExists(@Body() body: CheckWalletExistsDTO) {
    return this.authService.checkWalletExists(body.address);
  }

  /**
   * @description SIWE step 1 — request a single-use nonce + message to sign
   */
  @Post('/wallet/nonce')
  async walletNonce(@Body() body: WalletNonceDTO) {
    return this.authService.issueWalletNonce(body.address);
  }

  /**
   * @description register the user with the wallet (requires a signature over the nonce
   * message issued by /wallet/nonce)
   */
  @Post('/wallet/register')
  async walletRegister(@Body() body: RegisterAccountWithWalletDTO) {
    return this.authService.registerUserWithWallet(body);
  }

  /**
   * @description SIWE step 2 — login with the wallet by signing the nonce message
   */
  @UseGuards(WalletAuthGuard)
  @Post('/wallet/login')
  async walletLogin(@Body() body: LoginAccountWithWalletDTO) {
    return this.authService.loginUserWithWallet(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Get('/user')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/admin')
  getDashboard(@Request() req) {
    return req.user;
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    return this.authService.forgotPassword(body);
  }

  @Post('/reset-password')
  async resetPassword(@Body() body: ResetPasswordDTO) {
    return this.authService.resetPassword(body);
  }
}
