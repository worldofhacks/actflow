import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractConfigModule } from '../config/contract.config.module';
import { DomainModule } from '../domain/domain.module';
import { UserModule } from '../user/user.module';
import { ValidatorRepository } from './repository/validator.repository';
import { Validator, ValidatorSchema } from './schema/validator.schema';
import { ValidatorService } from './service/validator.service';
import { ValidatorController } from './validator.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Validator.name, schema: ValidatorSchema }]),
    forwardRef(() => DomainModule),
    ContractConfigModule,
    UserModule,
  ],
  controllers: [ValidatorController],
  providers: [ValidatorRepository, ValidatorService],
  exports: [ValidatorService, ValidatorRepository],
})
export class ValidatorsModule {}
