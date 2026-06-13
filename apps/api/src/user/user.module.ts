import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletModule } from '../wallet/wallet.module';
import { UserRepository } from './repository/user.repository';
import { UserDocument, UserSchema } from './schemas/user.schema';
import { UserService } from './services/user.service';
import { UserController } from './user.controller';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserDocument.name, schema: UserSchema }]),
    WalletModule,
  ],
  exports: [UserService, UserRepository],
  providers: [UserService, UserRepository],
  controllers: [UserController],
})
export class UserModule {}
