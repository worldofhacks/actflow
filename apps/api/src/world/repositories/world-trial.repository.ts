import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/services/base.repository';
import { WorldTrial, WorldTrialDocument } from '../schemas/world-trial.schema';

@Injectable()
export class WorldTrialRepository extends BaseRepository<WorldTrialDocument> {
  constructor(@InjectModel(WorldTrial.name) private readonly _model: Model<WorldTrialDocument>) {
    super(_model);
  }

  findByNullifier(action: string, nullifierHash: string): Promise<WorldTrialDocument | null> {
    return this._model.findOne({ action, nullifierHash }).exec();
  }

  /** Find the trial bucket linked to a given user for an action (most recent first). */
  findOneOrNull(action: string, userId: any): Promise<WorldTrialDocument | null> {
    return this._model.findOne({ action, userId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Credit a brand-new human exactly once. Uses an atomic upsert with $setOnInsert so that
   * concurrent verifies of the SAME nullifier never double-credit — the trials are only set
   * on the inserting call; subsequent calls leave freeTrialsRemaining untouched.
   *
   * Returns the doc plus whether THIS call created (credited) it.
   */
  async creditIfNew(params: {
    action: string;
    nullifierHash: string;
    freeTrials: number;
    apiVersion?: string;
    userId?: any;
  }): Promise<{ doc: WorldTrialDocument; credited: boolean }> {
    const { action, nullifierHash, freeTrials, apiVersion, userId } = params;

    const before = await this._model.findOne({ action, nullifierHash }).exec();

    const doc = await this._model
      .findOneAndUpdate(
        { action, nullifierHash },
        {
          $setOnInsert: {
            action,
            nullifierHash,
            freeTrialsRemaining: freeTrials,
            apiVersion,
            createdAt: new Date(),
            ...(userId ? { userId } : {}),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    return { doc, credited: !before };
  }

  /**
   * Atomically decrement freeTrialsRemaining by 1, only if there is at least one remaining.
   * Returns the updated doc, or null if there were no trials left (>=0 floor preserved).
   */
  async decrementIfAvailable(
    action: string,
    nullifierHash: string,
  ): Promise<WorldTrialDocument | null> {
    return this._model
      .findOneAndUpdate(
        { action, nullifierHash, freeTrialsRemaining: { $gte: 1 } },
        { $inc: { freeTrialsRemaining: -1 } },
        { new: true },
      )
      .exec();
  }
}
