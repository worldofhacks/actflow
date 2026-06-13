import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { TransactionHistoryItem } from '../../core/types';
import { UserTransactionsService } from '../../domain/common/user-transactions.service';

@Controller('transactions')
export class UserTransactionsController {
  constructor(private readonly userTransactionsService: UserTransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-transactions')
  async getMyTransactions(@Request() req): Promise<TransactionHistoryItem[]> {
    const userId = req.user.id;
    return this.userTransactionsService.getAllTransactionsForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions-by-address')
  async getTransactionsByAddress(@Request() req): Promise<TransactionHistoryItem[]> {
    const userId = req.user.id;
    return this.userTransactionsService.getTransactionsByAddress(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions-by-task-id')
  async getTransactionsByTaskId(@Request() req): Promise<TransactionHistoryItem[]> {
    const userId = req.user.id;
    return this.userTransactionsService.getTransactionsByTaskId(userId);
  }
}
