import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UserService } from '../user/services/user.service';
import { TokenAllowanceResponse, WalletBalanceResponse, WalletGenerationResponse } from './types';
import { WalletEncryptionService } from './wallet.encryption.service';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly encryptionService: WalletEncryptionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('wallet-info/:address')
  async getWalletInfo(
    @Request() req,
    @Param('address') address: string,
  ): Promise<WalletBalanceResponse> {
    const [nativeBalance, tokenBalance] = await Promise.all([
      this.walletService.getNativeBalance(address),
      this.walletService.getTokenBalance(address),
    ]);

    const isApprovedForMarketPlace = await this.userService.isWalletApprovedForMarketPlace(
      req.user._id,
      address,
    );

    return {
      nativeBalance,
      tokenBalance,
      address,
      isWalletGenerated: true,
      isApprovedForMarketPlace,
    };
  }

  // The WIP-token deposit endpoint (Story Protocol wrap) was removed during the
  // monorepo port; the revenue token is now a plain ERC-20.

  @UseGuards(JwtAuthGuard)
  @Post('max-allowance')
  async maxAllowanceWIP(
    @Request() req,
    @Body() dto: { walletAddress: string },
  ): Promise<TokenAllowanceResponse> {
    const privateKey = await this.getUserWalletPrivateKey(req.user._id, dto.walletAddress);

    const allowanceResult = await this.walletService.approveMarketplace(
      privateKey,
      ethers.MaxUint256,
    );
    if (allowanceResult.transactionHash) {
      await this.userService.updateWalletInfoByAddress(req.user._id, dto.walletAddress, {
        isApprovedForMarketPlace: true,
      });
    }

    return {
      transactionHash: allowanceResult.transactionHash,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateNewWallet(
    @Request() req,
    @Body() data: { name?: string },
  ): Promise<WalletGenerationResponse> {
    const userId = req.user._id;
    const wallet = this.walletService.generateWallet();

    const walletName = data.name || `Wallet ${new Date().toISOString().slice(0, 10)}`;

    await this.userService.updateUserPrivateKey(userId, {
      name: walletName,
      address: wallet.publicKey,
      privateKey: wallet.privateKey,
    });

    // const allowanceResult = await this.walletService.approveMarketplace(
    //   wallet.privateKey,
    //   ethers.MaxUint256,
    // );
    // if (allowanceResult.transactionHash) {
    //   await this.userService.updateWalletInfoByAddress(userId, wallet.publicKey, {
    //     isApprovedForMarketPlace: true,
    //   });
    // }

    return {
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      autoApproved: false,
      name: walletName,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.User)
  @Get('my-wallets')
  async getMyWallets(@Request() req): Promise<WalletBalanceResponse[]> {
    const userId = req.user._id;

    // Retrieve user with wallets
    const user = await this.userService.getUserById(userId);

    if (!user?.walletInfo || !Array.isArray(user.walletInfo)) {
      return [];
    }

    // Fetch balances for each wallet
    const walletsWithBalances = await Promise.all(
      user.walletInfo.map(async wallet => {
        const [nativeBalance, tokenBalance] = await Promise.all([
          this.walletService.getNativeBalance(wallet.address),
          this.walletService.getTokenBalance(wallet.address),
        ]);

        return {
          name: wallet.name,
          address: wallet.address,
          nativeBalance,
          tokenBalance,
          isWalletGenerated: wallet.isWalletGenerated,
          isApprovedForMarketPlace: wallet.isApprovedForMarketPlace,
        };
      }),
    );

    return walletsWithBalances;
  }

  //TODO: DRY
  private async getUserWalletPrivateKey(userId: any, walletAddress: string): Promise<string> {
    const privateKeyForWallet = await this.userService.getUserWalletPrivateKey(
      userId,
      walletAddress,
    );
    return this.encryptionService.decryptPrivateKey(privateKeyForWallet);
  }
}
