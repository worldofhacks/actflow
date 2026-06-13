import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UpdateUserDto } from './dtos/create-user.dto';
import { SocialAccountDto } from './dtos/linked-accounts.dto';
import { UserReferralCountDto } from './dtos/user-referral-count.dto';
import { UserDocument } from './schemas/user.schema';
import { UserService } from './services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('/all')
  getAllUsers(): Promise<UserDocument[]> {
    return this.userService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Get('/top-referral-users')
  getTopReferralUsers(
    @Query('limit') limit: string,
    @Query('sort') sort: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<UserDocument[]> {
    const timeFrame =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;
    return this.userService.getTopReferralUsers(limit, sort, timeFrame);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  getUserProfile(@Request() req): Promise<UserDocument> {
    return this.userService.getUserProfile(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateUser(
    @Param('id', new ParseObjectIdPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    console.log('req.user', req.user);
    if (req.user._id !== id) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    return this.userService.updateUser(id, updateUserDto);
  }

  // get current user's referrer count
  @UseGuards(JwtAuthGuard)
  @Post('/referrer-count')
  getReferrerCount(@Body() body: UserReferralCountDto): Promise<{ count: number }> {
    return this.userService.getReferrerCount(body.username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-rank/:userId')
  async getUserRank(@Param('userId') userId: string) {
    const rank = await this.userService.getUserRank(userId);
    return { rank };
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-reward-progress')
  async getRewardProgress(@Request() req): Promise<{
    dailyStreak: number;
    monthlyReferrals: number;
    totalReferrals: number;
  }> {
    return this.userService.getRewardProgress(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('linked-accounts/:platform')
  async linkAccount(
    @Request() req,
    @Param('platform') platform: string,
    @Body() accountData: SocialAccountDto,
  ) {
    return this.userService.linkAccount(req.user._id, platform, accountData);
  }

  @UseGuards(JwtAuthGuard)
  @Put('linked-accounts/:platform')
  async updateLinkedAccount(
    @Request() req,
    @Param('platform') platform: string,
    @Body() accountData: SocialAccountDto,
  ) {
    return this.userService.updateLinkedAccount(req.user._id, platform, accountData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('linked-accounts/unlink-all')
  async unlinkAllAccounts(@Request() req) {
    return this.userService.unlinkAllAccounts(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('linked-accounts/:platform')
  async unlinkAccount(@Request() req, @Param('platform') platform: string) {
    return this.userService.unlinkAccount(req.user._id, platform);
  }

  @UseGuards(JwtAuthGuard)
  @Get('linked-accounts')
  async getLinkedAccounts(@Request() req) {
    return this.userService.getLinkedAccounts(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-referrer-info')
  async updateReferrerInfo(@Request() req, @Body() body: { referrer: string }) {
    return this.userService.updateReferrerInfo(req.user._id, body.referrer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-referral-code')
  async createReferralCode(@Request() req, @Body() body: { referralCode: string }) {
    return this.userService.createReferralCode(req.user._id, body.referralCode);
  }
}
