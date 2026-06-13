import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/services/base.repository';
import {
  PaymentReceipt,
  PaymentReceiptDocument,
} from '../schemas/payment-receipt.schema';

@Injectable()
export class PaymentReceiptRepository extends BaseRepository<PaymentReceiptDocument> {
  constructor(
    @InjectModel(PaymentReceipt.name)
    private readonly _model: Model<PaymentReceiptDocument>,
  ) {
    super(_model);
  }

  /** Find a single receipt by its mongo id (null when absent — caller decides 404). */
  findByIdOrNull(id: string): Promise<PaymentReceiptDocument | null> {
    return this._model.findById(id).exec();
  }

  /**
   * Payment history filtered by payer and/or agent (at least one is expected). Newest first.
   * Both are matched case-insensitively because EVM addresses are case-insensitive.
   */
  findHistory(
    filter: { payer?: string; agent?: string; userId?: string },
    options: { skip?: number; limit?: number } = {},
  ): Promise<PaymentReceiptDocument[]> {
    const query: Record<string, unknown> = {};
    if (filter.payer) {
      query.payer = { $regex: `^${escapeRegex(filter.payer)}$`, $options: 'i' };
    }
    if (filter.agent) {
      query.agent = { $regex: `^${escapeRegex(filter.agent)}$`, $options: 'i' };
    }
    if (filter.userId) {
      query.userId = filter.userId;
    }
    return this._model
      .find(query)
      .sort({ createdAt: -1 })
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 100)
      .exec();
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
