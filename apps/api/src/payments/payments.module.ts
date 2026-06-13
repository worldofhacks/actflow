import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskModule } from '../task/task.module';
import { WorldModule } from '../world/world.module';
import { PaymentsConfig } from './payments.config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentReceiptRepository } from './repositories/payment-receipt.repository';
import {
  PaymentReceipt,
  PaymentReceiptSchema,
} from './schemas/payment-receipt.schema';
import { TaskUnlockService } from './task-unlock.service';

/**
 * x402 / Arc USDC payment layer.
 *
 *  - WorldModule  : free-trial alternative to payment (consumeFreeTrial).
 *  - TaskModule   : ties a verified unlock back into the existing task service.
 *
 * The x402 ESM package + the @actflow/sdk Arc config are loaded at runtime via
 * ./x402.loader (CJS<->ESM interop) — no provider wiring needed for those.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentReceipt.name, schema: PaymentReceiptSchema },
    ]),
    WorldModule,
    TaskModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsConfig,
    PaymentReceiptRepository,
    PaymentsService,
    TaskUnlockService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
