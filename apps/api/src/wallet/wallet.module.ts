import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { WalletController } from './wallet.controller';
import { WalletEncryptionService } from './wallet.encryption.service';
import { WalletService } from './wallet.service';

@Module({
  imports: [ConfigModule, forwardRef(() => UserModule)],
  providers: [WalletService, WalletEncryptionService],
  exports: [WalletService, WalletEncryptionService],
  controllers: [WalletController],
})
export class WalletModule {}
