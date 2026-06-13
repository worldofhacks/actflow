import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Role } from '../../auth/enums/role.enum';
import { LinkedAccounts } from '../../types/user';
import { ProviderDto } from '../dtos/provider-information.dto';

// NOTE: the Phyllo and invitation-code fields were removed during the monorepo port.
// Old production data may still contain `phylloInformation` / `invitationCode` /
// `invitationAcceptedAt`; Mongoose simply ignores them on read (no migrations exist).

@Schema({
  timestamps: true,
  collection: 'users',
})
export class UserDocument extends Document {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 8,
    select: false, // This ensures that the password is not returned in queries
  })
  password: string;

  @Prop({
    type: [String],
    enum: Role,
    default: [Role.User],
    required: true,
  })
  roles: Role[];

  @Prop({
    default: true,
  })
  isActive: boolean;

  /**
   * Whether the user's email has been verified
   */
  @Prop({
    default: false,
  })
  isEmailVerified: boolean;

  /**
   * The date when the user's email was verified
   */
  @Prop({
    required: false,
    default: null,
  })
  emailVerifiedAt: Date;

  @Prop({
    type: ProviderDto,
    required: false,
  })
  provider: ProviderDto;

  /**
   * the referralCode of the user who referred the current user
   */
  @Prop({
    required: false,
  })
  referrer: string;

  /**
   * the referral code of the user which is used to refer other users
   */
  @Prop({
    required: false,
    unique: true,
  })
  referralCode: string;

  /**
   * the number of users referred by the current user, will be incremented when a new user is referred by the current user
   */
  @Prop({
    required: false,
    default: 0,
  })
  referralCount: number;

  /**
   * Array of referral records containing timestamp and referred user ID
   */
  @Prop({
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  referralHistory: Array<{ userId: mongoose.Types.ObjectId; createdAt: Date }>;

  @Prop({
    type: [
      {
        name: {
          type: String,
          required: false,
          default: 'My Wallet',
        },
        address: {
          type: String,
          required: true,
          unique: false,
          lowercase: true,
          trim: true,
        },
        encryptedPrivateKey: {
          type: String,
          required: true,
          select: false, // Prevent accidental retrieval
        },
        isWalletGenerated: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isApprovedForMarketPlace: {
          type: Boolean,
          default: false,
        },
      },
    ],
    default: [],
    required: false,
  })
  // TODO: address is stored lowercase in the db, but we should store it case-sensitive
  walletInfo?: {
    name: string;
    address: string;
    encryptedPrivateKey: string;
    isWalletGenerated: boolean;
    createdAt: Date;
    isApprovedForMarketPlace: boolean;
  }[];

  @Prop({
    type: {
      twitter: {
        type: {
          access_token: String,
          refresh_token: String,
          id: String,
          username: String,
          platform: String,
          connected_at: Date,
          // the number of twitter interactions of the current user (e.g. posted tweets about the platform)
          interactions: Number,
        },
        _id: false,
        required: false,
      },
      instagram: {
        type: {
          access_token: String,
          refresh_token: String,
          id: String,
          username: String,
          platform: String,
          connected_at: Date,
          // the number of instagram interactions of the current user (e.g. posted posts about the platform)
          interactions: Number,
        },
        _id: false,
        required: false,
      },
      google: {
        type: {
          access_token: String,
          refresh_token: String,
          id: String,
          username: String,
          platform: String,
          connected_at: Date,
          // the number of google interactions of the current user (e.g. posted posts about the platform)
          interactions: Number,
        },
        _id: false,
        required: false,
      },
    },
    required: false,
  })
  linkedAccounts: LinkedAccounts;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

UserSchema.index(
  { 'walletInfo.address': 1 },
  {
    unique: true,
    sparse: true, // This allows documents without walletInfo to exist
    partialFilterExpression: { 'walletInfo.address': { $exists: true } }, // Only index non-null values
  },
);
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
