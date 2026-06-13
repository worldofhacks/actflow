import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ethers } from 'ethers';
import { DecryptedToken } from '../types/user';
import { CreateUserDTO } from '../user/dtos/create-user.dto';
import { ForgotPasswordDTO } from '../user/dtos/forgot-password.dto';
import { ResetPasswordDTO } from '../user/dtos/reset-password.dto';
import { UserDocument } from '../user/schemas/user.schema';
import { UserService } from '../user/services/user.service';
import { LoginAccountWithWalletDTO } from './dtos/login-account-with-wallet.dto';
import { RegisterAccountWithWalletDTO } from './dtos/register-account-with-wallet.dto';

interface WalletNonceEntry {
  nonce: string;
  expiresAt: number;
}

/** Nonces are valid for five minutes. */
const NONCE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * In-memory SIWE nonce store, keyed by lowercased address.
   * TODO: move to a shared store (Mongo/Redis) before running multiple api instances.
   */
  private readonly walletNonces = new Map<string, WalletNonceEntry>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found with this email');
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (user && isPasswordMatch) {
      return user;
    }
    throw new UnauthorizedException('Invalid password');
  }

  // ---------------------------------- WALLET (SIWE-style) ----------------------------------

  /**
   * Step 1 of the sign-in-with-wallet flow: issue a single-use nonce and the exact
   * message the client must sign with the wallet that owns `address`.
   */
  issueWalletNonce(address: string): { address: string; nonce: string; message: string } {
    if (!ethers.isAddress(address)) {
      throw new BadRequestException('Invalid wallet address');
    }
    const checksummed = ethers.getAddress(address);
    const nonce = crypto.randomBytes(16).toString('hex');
    this.walletNonces.set(checksummed.toLowerCase(), {
      nonce,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });
    return {
      address: checksummed,
      nonce,
      message: this.buildWalletMessage(checksummed, nonce),
    };
  }

  /**
   * SIWE-style message. TODO: upgrade to a full EIP-4361 message (siwe package) including
   * domain/uri/chainId once the frontend wallet flow is wired up.
   */
  private buildWalletMessage(address: string, nonce: string): string {
    return `ActFlow wants you to sign in with your Ethereum account:\n${address}\n\nNonce: ${nonce}`;
  }

  /**
   * Verifies that `signature` is a signature over the previously-issued nonce message
   * by `address`. Consumes the nonce (single use). Throws on any failure.
   */
  verifyWalletSignature(address: string, signature: string): void {
    if (!ethers.isAddress(address)) {
      throw new UnauthorizedException('Invalid wallet address');
    }
    const checksummed = ethers.getAddress(address);
    const key = checksummed.toLowerCase();
    const entry = this.walletNonces.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.walletNonces.delete(key);
      throw new UnauthorizedException('Nonce missing or expired; request a new nonce first');
    }

    let recovered: string;
    try {
      recovered = ethers.verifyMessage(
        this.buildWalletMessage(checksummed, entry.nonce),
        signature,
      );
    } catch {
      throw new UnauthorizedException('Malformed wallet signature');
    }

    // Single use, success or not.
    this.walletNonces.delete(key);

    if (recovered.toLowerCase() !== key) {
      throw new UnauthorizedException('Signature does not match wallet address');
    }
  }

  /**
   * Wallet login validation: verifies the signature over the issued nonce, then resolves
   * the user. The legacy wallet login was replaced with this SIWE-style flow during the
   * monorepo port.
   */
  async validateWallet(address: string, signature: string): Promise<UserDocument> {
    this.verifyWalletSignature(address, signature);
    const user = await this.userService.findUserByWalletAddress(address);
    if (!user) {
      throw new UnauthorizedException('User not found with this Wallet Address');
    }
    return user;
  }

  async checkWalletExists(
    address: string,
  ): Promise<{ success: boolean; user: UserDocument | null }> {
    const user = await this.userService.findUserByWalletAddress(address);
    return user
      ? {
          success: true,
          user,
        }
      : {
          success: false,
          user: null,
        };
  }

  async loginUserWithWallet(body: LoginAccountWithWalletDTO) {
    // Signature already verified by WalletAuthGuard/WalletStrategy.
    const user = await this.userService.findUserByWalletAddress(body.address);
    if (!user) {
      throw new UnauthorizedException('User not found with this Wallet Address');
    }
    return this.login(user);
  }

  async registerUserWithWallet(body: RegisterAccountWithWalletDTO) {
    // Registration cannot go through the passport strategy (no user yet), so the
    // signature over the issued nonce is verified here.
    this.verifyWalletSignature(body.address, body.signature);
    const user = await this.userService.registerWallet(body);
    return this.login(user);
  }

  // ---------------------------------- SESSIONS ----------------------------------

  async login(user: UserDocument) {
    const payload = {
      username: user.username,
      sub: user._id,
      roles: user.roles,
      email: user.email,
      provider: user.provider,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // ---------------------------------- EMAIL/PASSWORD ----------------------------------

  async register(createUserDTO: CreateUserDTO) {
    // Email verification + invitation-code gating were removed with the email module.
    // Users are created unverified; REQUIRE_EMAIL_VERIFICATION stays off until an email
    // provider is wired up again.
    return this.userService.addUser(createUserDTO);
  }

  async forgotPassword({ email }: ForgotPasswordDTO) {
    try {
      const user = await this.userService.findUserByEmail(email);

      if (user) {
        const resetPasswordToken = this.jwtService.sign({ email }, { expiresIn: '1h' });
        // TODO(email): the email module was dropped in the port; nothing is sent yet.
        // Wire an email provider here and deliver `resetPasswordToken` to the user.
        this.logger.warn(
          `forgotPassword requested for ${email} but email sending is not configured; token not delivered`,
        );
        void resetPasswordToken;
      }

      return {
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      };
    } catch (error) {
      console.error('Forgot password error', error);
      throw new BadRequestException('Failed to process forgot password request');
    }
  }

  async resetPassword({ password, token }: ResetPasswordDTO) {
    try {
      const decryptedToken = this.jwtService.verify<DecryptedToken>(token);
      if (decryptedToken.email) {
        const updatedUser = await this.userService.updateUserPassword(
          decryptedToken.email,
          password,
        );
        if (!updatedUser) throw new BadRequestException('User not found');
        return updatedUser;
      } else throw new UnauthorizedException('Invalid token');
    } catch (error) {
      console.error('Reset password error', error);
      throw new BadRequestException('Failed to reset password', error.message);
    }
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const user = await this.userService.findUserByEmail(email);
    return user ? user.isEmailVerified : false;
  }

  async validateUserWithVerification(
    email: string,
    password: string,
    requireVerification: boolean = true,
  ): Promise<any> {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found with this email');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    if (requireVerification && !user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified. Please verify your email to continue.');
    }

    return user;
  }
}
