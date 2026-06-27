import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UpdateUserWalletDTO } from '../../auth/dtos/add-pk-to-user.dto';
import { RegisterAccountWithWalletDTO } from '../../auth/dtos/register-account-with-wallet.dto';
import { WalletEncryptionService } from '../../wallet/wallet.encryption.service';
import { CreateUserDTO, UpdateUserDto } from '../dtos/create-user.dto';
import { SocialAccountDto } from '../dtos/linked-accounts.dto';
import { ProviderType } from '../dtos/provider-information.dto';
import { UserRepository } from '../repository/user.repository';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  /**
   * this bonus will be rewarded to the user when they interact with the twitter account (like tweet about our platform)
   */
  private readonly TWITTER_INTERACTION_BONUS = 10;
  /**
   * this bonus will be rewarded to the user when they connect their twitter account to our web
   */
  private readonly TWITTER_CONNECTION_BONUS = 40;
  /**
   * this bonus will be rewarded to the user when they refer a new user to our platform
   */
  private readonly REFERRAL_BONUS = 20;
  private readonly validPlatforms = ['twitter', 'instagram', 'google'];
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => WalletEncryptionService))
    private readonly walletEncryptionService: WalletEncryptionService,
  ) {}

  async addUser(createUserDTO: CreateUserDTO): Promise<UserDocument> {
    // on new user creation match if the referrer field matches with the referral code of any user then update the referrer count and if operation fails revert the changes
    const session = await this.userRepository.startSession();
    session.startTransaction();
    try {
      const existingUser = await this.userRepository.findOne({
        $or: [
          { email: createUserDTO.email },
          { username: createUserDTO.username },
          ...(createUserDTO.referralCode ? [{ referralCode: createUserDTO.referralCode }] : []),
        ],
      });

      if (existingUser) {
        if (existingUser.email === createUserDTO.email) {
          throw new BadRequestException('Email already exists');
        }
        if (existingUser.username === createUserDTO.username) {
          throw new BadRequestException('Username already exists');
        }
        if (existingUser.referralCode === createUserDTO.referralCode) {
          throw new BadRequestException('Referral code already exists');
        }
      }

      const hashedPassword = await bcrypt.hash(createUserDTO.password, 10);
      const newUser = await this.userRepository.create({
        ...createUserDTO,
        password: hashedPassword,
        referralCode: createUserDTO.referralCode ?? Math.random().toString(36).substring(2, 8),
        provider: {
          type: ProviderType.CREDENTIALS,
        },
      });

      if (createUserDTO.referrer) {
        await this.userRepository.findOneAndUpdate(
          { referralCode: createUserDTO.referrer },
          {
            $inc: { referralCount: 1 },
            $push: {
              referralHistory: {
                userId: newUser._id,
                createdAt: new Date(),
              },
            },
          },
          { session },
        );
      }
      await session.commitTransaction();
      return newUser;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        switch (field) {
          case 'email':
            throw new BadRequestException('Email already exists');
          case 'username':
            throw new BadRequestException('Username already exists');
          case 'referralCode':
            throw new BadRequestException('Referral code already exists');
          case 'walletInfo.address':
            throw new BadRequestException('Wallet address already exists');
          default:
            throw new BadRequestException('Duplicate entry detected');
        }
      }

      throw new BadRequestException('Error creating user');
    } finally {
      await session.endSession();
    }
  }
  async updateUser(userId: string, updateUserDto: Partial<UpdateUserDto>): Promise<UserDocument> {
    // Create update object only with provided fields
    const updateData: any = {};

    // Only include fields that were actually provided
    Object.keys(updateUserDto).forEach(key => {
      if (updateUserDto[key] !== undefined) {
        // Special handling for password
        if (key === 'password') {
          updateData[key] = bcrypt.hashSync(updateUserDto[key], 10);
        } else {
          updateData[key] = updateUserDto[key];
        }
      }
    });

    const updatedUser = await this.userRepository.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true, projection: '-password' },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }
  // addGoogleUser / addTwitterUser were removed during the monorepo port; social login
  // should come back only as a proper server-side OAuth flow.

  /**
   * Find user by MongoDB ID
   * @param userId User's MongoDB ID
   * @returns User document or throws NotFoundException
   */
  async findUserById(userId: string): Promise<UserDocument> {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Invalid user ID');
    }
  }

  async findUser(username: string): Promise<UserDocument | undefined> {
    const user = await this.userRepository.findOne({ username: username });
    return user;
  }
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findOne({ email }, '+password');
  }

  async updateUserPassword(email: string, password: string) {
    // hash password and update user password
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userRepository.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true },
    );
  }

  async getUserProfile(user: Partial<UserDocument>): Promise<UserDocument> {
    return this.getUserById(user._id.toString());
  }

  async getAllUsers(): Promise<UserDocument[]> {
    return this.userRepository.findAll();
  }

  async getTopReferralUsers(
    limit?: string,
    sort?: string,
    timeFrame?: { start: Date; end: Date },
  ): Promise<UserDocument[]> {
    if (!sort && !limit) {
      return this.userRepository.findAll();
    } else {
      const aggregate = [];

      // Add Twitter bonus points calculation
      aggregate.push({
        $addFields: {
          twitterBonus: {
            $sum: [
              // Add 40 points if Twitter account is linked
              {
                $cond: [
                  { $ifNull: ['$linkedAccounts.twitter', false] },
                  this.TWITTER_CONNECTION_BONUS,
                  0,
                ],
              },
              // Add points for interactions (interactions * 10)
              {
                $multiply: [
                  {
                    $ifNull: ['$linkedAccounts.twitter.interactions', 0],
                  },
                  this.TWITTER_INTERACTION_BONUS,
                ],
              },
            ],
          },
        },
      });

      if (timeFrame) {
        // First ensure referralHistory exists and is an array
        aggregate.push({
          $addFields: {
            referralHistory: {
              $ifNull: ['$referralHistory', []],
            },
          },
        });

        // Count only referrals within the specified time frame
        aggregate.push({
          $addFields: {
            filteredReferralCount: {
              $size: {
                $filter: {
                  input: '$referralHistory',
                  as: 'referral',
                  cond: {
                    $and: [
                      { $gte: ['$$referral.createdAt', timeFrame.start] },
                      { $lte: ['$$referral.createdAt', timeFrame.end] },
                    ],
                  },
                },
              },
            },
          },
        });

        // Add total score including referrals and Twitter bonus
        aggregate.push({
          $addFields: {
            totalScore: {
              $add: [
                { $multiply: ['$filteredReferralCount', this.REFERRAL_BONUS] },
                '$twitterBonus',
              ],
            },
          },
        });

        // Sort by the total score and then by filteredReferralCount for tie-breaking
        aggregate.push({
          $sort: {
            totalScore: -1,
            filteredReferralCount: -1,
          },
        });
      } else if (sort) {
        // Add total score including referral count and Twitter bonus
        aggregate.push({
          $addFields: {
            totalScore: {
              $add: [{ $multiply: ['$referralCount', this.REFERRAL_BONUS] }, '$twitterBonus'],
            },
          },
        });

        // If sort is 'referralCount', sort by totalScore and use referralCount as tie-breaker
        // Otherwise use the specified sort field
        aggregate.push({
          $sort:
            sort === 'referralCount'
              ? { totalScore: -1, referralCount: -1 }
              : { [sort]: -1, referralCount: -1 },
        });
      }

      if (limit && !isNaN(parseInt(limit, 10))) {
        aggregate.push({
          $limit: parseInt(limit, 10),
        });
      }

      return this.userRepository.aggregate(aggregate);
    }
  }

  async getUserById(id: string, includePrivateKey = false): Promise<UserDocument> {
    const user = this.userRepository.findByIdQuery(id);

    if (includePrivateKey) {
      user.select('+walletInfo.encryptedPrivateKey').lean();
    }

    return user;
  }

  /**
   * Helper method to get user wallet private key
   */
  async getUserWalletPrivateKey(userId: any, walletAddress: string): Promise<string> {
    const user = await this.getUserById(userId, true);

    // Find the specific wallet
    const walletInfo = user.walletInfo.find(
      wallet => wallet.address.toLowerCase() === walletAddress.toLowerCase(),
    );

    if (!walletInfo) {
      throw new Error('Wallet not found');
    }

    return walletInfo.encryptedPrivateKey;
  }

  async updateUserPrivateKey(
    userId: string,
    updateWalletDto: UpdateUserWalletDTO,
  ): Promise<UserDocument> {
    try {
      // Encrypt the private key if provided
      const newWalletEntry = updateWalletDto.privateKey
        ? {
            name: updateWalletDto.name,
            address: updateWalletDto.address,
            encryptedPrivateKey: this.walletEncryptionService.encryptPrivateKey(
              updateWalletDto.privateKey,
            ),
            isWalletGenerated: true,
            createdAt: new Date(),
          }
        : null;

      // Update user by pushing new wallet entry or updating existing address
      const updatedUser = await this.userRepository.findByIdAndUpdate(
        userId,
        newWalletEntry
          ? { $push: { walletInfo: newWalletEntry } }
          : { $set: { 'walletInfo.$[].address': updateWalletDto.address } },
        { new: true, runValidators: true },
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async registerWallet(body: RegisterAccountWithWalletDTO): Promise<UserDocument> {
    // No multi-document transaction here: the dev/standalone mongod has no
    // replica set, so startTransaction() throws. User creation is a single
    // document; the referral credit is applied best-effort afterwards.
    // `signature` is verification-only and must NOT be persisted on the user.
    const { signature: _signature, ...rest } = body;
    const hashedPassword = await bcrypt.hash('wallet123', 10);
    const newUser = await this.userRepository.create({
      ...rest,
      // default password for wallet users
      password: hashedPassword,
      referralCode: Math.random().toString(36).substring(2, 8),
      provider: { type: ProviderType.WALLET, address: body.address },
    });

    if (body.referrer) {
      try {
        const referrer = await this.userRepository.findOne({ referralCode: body.referrer });
        if (referrer) {
          referrer.referralCount++;
          referrer.referralHistory.push({
            userId: newUser._id as Types.ObjectId,
            createdAt: new Date(),
          });
          await referrer.save();
        }
      } catch {
        // best-effort: a failed referral credit must not fail registration
      }
    }

    return newUser;
  }

  async findUserByWalletAddress(address: string, email?: string): Promise<UserDocument> {
    return this.userRepository.findOne({
      ...(email ? { email } : {}),
      provider: { type: ProviderType.WALLET, address },
    });
  }

  async updateWalletInfoByAddress(
    userId: string,
    walletAddress: string,
    data: {
      isWalletGenerated?: boolean;
      isApprovedForMarketPlace?: boolean;
      name?: string;
    },
  ) {
    const user = await this.userRepository.findOne({ _id: userId });
    const requiredWallet = user.walletInfo.find(
      wallet => wallet.address.toLowerCase() === walletAddress.toLowerCase(),
    );
    if (!requiredWallet) {
      throw new BadRequestException('Wallet Not Found');
    }
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        requiredWallet[key] = value;
      }
    });
    return user.save();
  }

  /**
   * get the number of users who have the current user as their referrer
   * @param user the current user
   * @returns the number of users who have the current user as their referrer
   */
  async getReferrerCount(username: string): Promise<{ count: number }> {
    const count = await this.userRepository.count({ referrer: username });
    return { count };
  }

  async getUserRank(userId: string): Promise<number> {
    // First aggregate to calculate scores and create a sortable value
    const usersWithScores = await this.userRepository.aggregate([
      // Calculate Twitter bonus points
      {
        $addFields: {
          twitterBonus: {
            $sum: [
              // Add 40 points if Twitter account is linked
              {
                $cond: [
                  { $ifNull: ['$linkedAccounts.twitter', false] },
                  this.TWITTER_CONNECTION_BONUS,
                  0,
                ],
              },
              // Add points for interactions (interactions * 10)
              {
                $multiply: [
                  {
                    $ifNull: ['$linkedAccounts.twitter.interactions', 0],
                  },
                  this.TWITTER_INTERACTION_BONUS,
                ],
              },
            ],
          },
        },
      },
      // Calculate total score
      {
        $addFields: {
          totalScore: {
            $add: [{ $multiply: ['$referralCount', this.REFERRAL_BONUS] }, '$twitterBonus'],
          },
          // Create a compound sorting value - convert referralCount and createdAt to smaller decimals
          sortValue: {
            $add: [
              { $add: [{ $multiply: ['$referralCount', this.REFERRAL_BONUS] }, '$twitterBonus'] }, // Base score
              { $divide: ['$referralCount', 1000] }, // Add small fraction for referral count (0.001 per referral)
              {
                $cond: [
                  { $ifNull: ['$createdAt', false] },
                  // Convert createdAt to a small decimal based on timestamp
                  // Earlier dates will have smaller values, resulting in higher ranks for older accounts
                  { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 31536000000000] }, // Divide by a large number to make it a small fraction
                  0,
                ],
              },
            ],
          },
        },
      },
      // Now we can sort by this single compound value
      {
        $sort: { sortValue: -1 },
      },
      // Add the rank field
      {
        $setWindowFields: {
          sortBy: { sortValue: -1 },
          output: {
            rank: {
              $rank: {},
            },
          },
        },
      },
      // Only keep fields we need
      {
        $project: {
          _id: 1,
          totalScore: 1,
          referralCount: 1,
          createdAt: 1,
          rank: 1,
        },
      },
    ]);

    // Find the user's rank from the results
    const userRank = usersWithScores.find(user => user._id.toString() === userId)?.rank || 0;

    return userRank;
  }

  async getRewardProgress(userId: string): Promise<{
    dailyStreak: number;
    monthlyReferrals: number;
    totalReferrals: number;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate monthly referrals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyReferrals = user.referralHistory.filter(
      ref => ref.createdAt >= thirtyDaysAgo,
    ).length;

    let currentStreak = 0;
    if (user.referralHistory.length > 0) {
      const sortedReferrals = user.referralHistory.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentDate = new Date(sortedReferrals[0].createdAt);
      currentDate.setHours(0, 0, 0, 0);

      // Check if the latest referral is from today or yesterday
      if (today.getTime() - currentDate.getTime() <= 86400000) {
        currentStreak = 1;

        // Group referrals by date to check for consecutive days and make sure 'multiple referrals' on the same day will map to the same key
        const referralsByDate = new Map<string, boolean>();
        sortedReferrals.forEach(ref => {
          const date = new Date(ref.createdAt);
          date.setHours(0, 0, 0, 0);
          referralsByDate.set(date.toISOString(), true);
        });

        // Count consecutive days
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

        while (referralsByDate.has(checkDate.toISOString())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    return {
      dailyStreak: currentStreak,
      monthlyReferrals,
      totalReferrals: user.referralCount,
    };
  }

  private validatePlatform(platform: string): void {
    if (!this.validPlatforms.includes(platform.toLowerCase())) {
      throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  async linkAccount(
    userId: string,
    platform: string,
    accountData: SocialAccountDto,
  ): Promise<UserDocument> {
    this.validatePlatform(platform);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.linkedAccounts) {
      user.linkedAccounts = {};
    }

    // Add connected_at if not provided
    if (!accountData.connected_at) {
      accountData.connected_at = new Date();
    }

    // Set the platform in the account data
    accountData.platform = platform;

    // Update the specific platform's data
    user.linkedAccounts[platform] = accountData;

    return user.save();
  }

  async updateLinkedAccount(
    userId: string,
    platform: string,
    accountData: SocialAccountDto,
  ): Promise<UserDocument> {
    this.validatePlatform(platform);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.linkedAccounts?.[platform]) {
      throw new BadRequestException(`No linked account found for platform: ${platform}`);
    }

    // Preserve the original connected_at date
    accountData.connected_at = user.linkedAccounts[platform].connected_at;
    accountData.platform = platform;

    user.linkedAccounts[platform] = accountData;
    return user.save();
  }

  async unlinkAccount(userId: string, platform: string): Promise<UserDocument> {
    this.validatePlatform(platform);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.linkedAccounts) {
      user.linkedAccounts[platform] = null;
    }

    return user.save();
  }

  async unlinkAllAccounts(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.linkedAccounts) {
      this.validPlatforms.map(platform => {
        user.linkedAccounts[platform] = null;
      });
    } else {
      user.linkedAccounts = {};
    }
    return user.save();
  }

  async getLinkedAccounts(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.linkedAccounts || {};
  }

  async getUserWallets(userId: string): Promise<{ address: string; name: string }[]> {
    const user = await this.userRepository.findByIdQuery(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.walletInfo.map(wallet => ({
      address: wallet.address,
      name: wallet.name,
    }));
  }

  async updateReferrerInfo(userId: string, referrer: string) {
    const session = await this.userRepository.startSession();
    session.startTransaction();
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.referrer) {
        throw new BadRequestException('Referrer already set');
      } else {
        // update the referral count of the referrer
        const referrerUser = await this.userRepository.findOne({ referralCode: referrer });
        if (referrerUser) {
          referrerUser.referralCount++;
          referrerUser.referralHistory.push({
            userId: user._id as Types.ObjectId,
            createdAt: new Date(),
          });
          await referrerUser.save();
        }
        // update the referrer info of the user
        user.referrer = referrer;
        await user.save();
        await session.commitTransaction();
        return user;
      }
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      await session.endSession();
    }
  }

  async createReferralCode(userId: string, referralCode: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.referralCode) {
      throw new BadRequestException('Referral code already exists');
    }
    if (referralCode.length < 6) {
      throw new BadRequestException('Referral code must be at least 6 characters long');
    }
    if (referralCode.includes(' ')) {
      throw new BadRequestException('Referral code cannot contain spaces');
    }
    const existingUser = await this.userRepository.findOne({ referralCode });
    if (existingUser) {
      throw new BadRequestException('Referral code already taken by another user');
    }
    user.referralCode = referralCode;
    return user.save();
  }

  async findUserByAddress(address: string): Promise<UserDocument | null> {
    return this.userRepository.findOne({ 'walletInfo.address': address });
  }

  async isWalletApprovedForMarketPlace(userId: string, address: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return (
      user?.walletInfo.some(
        wallet => wallet.address === address && wallet.isApprovedForMarketPlace,
      ) || false
    );
  }
}
