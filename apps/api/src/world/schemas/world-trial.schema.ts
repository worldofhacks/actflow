import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type WorldTrialDocument = WorldTrial & Document;

/**
 * One document per unique human (keyed by World ID nullifier_hash).
 *
 * The nullifier is "a unique identifier for a combination of a user, app_id, and action"
 * (World docs) — i.e. the same human + same action always yields the same nullifier, so a
 * UNIQUE index on (action, nullifierHash) enforces one-trial-bucket-per-human. This is the
 * anti-sybil / anti-replay key: re-verifying the same proof maps to the same doc and never
 * re-credits trials.
 */
@Schema({ timestamps: true, collection: 'worldtrials' })
export class WorldTrial {
  /** The World ID nullifier hash — the dedup key. */
  @Prop({ required: true })
  nullifierHash: string;

  /** The action the proof was verified against (defense-in-depth on the unique index). */
  @Prop({ required: true })
  action: string;

  /** Free trials still available to this human. Initialised on first verify. */
  @Prop({ required: true, default: 0, min: 0 })
  freeTrialsRemaining: number;

  /** Which verify endpoint credited this human ('v4' | 'v2'). */
  @Prop({ required: false })
  apiVersion?: string;

  /** Optional linked ActFlow user (set when verified by an authenticated user). */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const WorldTrialSchema = SchemaFactory.createForClass(WorldTrial);

// One bucket per (action, human). UNIQUE => second verify of the same nullifier can never
// create a second crediting doc (one-per-human).
WorldTrialSchema.index({ action: 1, nullifierHash: 1 }, { unique: true });
