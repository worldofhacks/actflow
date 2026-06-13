import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventMapper } from '../../blockchain/event.mapper';
import { BlockchainEventRepository } from '../../blockchain/repository/events.repository';
import { TransactionHistoryItem } from '../../core/types';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class UserTransactionsService {
  private readonly logger = new Logger(UserTransactionsService.name);

  constructor(
    private readonly blockchainEventRepository: BlockchainEventRepository,
    private readonly userService: UserService,
  ) {}

  async getAllTransactionsForUser(userId: string): Promise<TransactionHistoryItem[]> {
    try {
      const user = await this.userService.findUserById(userId);

      if (!user.walletInfo || user.walletInfo.length === 0) {
        return [];
      }

      const walletAddresses = user.walletInfo.map(wallet => wallet.address.toLowerCase());

      const transactions = await this.blockchainEventRepository.findBySenders(walletAddresses);

      return EventMapper.fromDocumentsToApiResponse(transactions);
    } catch (error) {
      this.logger.error(`Error fetching transactions for user ${userId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  async getTransactionsByAddress(userId: string): Promise<TransactionHistoryItem[]> {
    const user = await this.userService.findUserById(userId);
    const walletAddresses = user.walletInfo.map(wallet => wallet.address.toLowerCase());
    const transactions = await this.blockchainEventRepository.findBySenders(walletAddresses);
    return EventMapper.fromDocumentsToApiResponse(transactions);
  }

  async getTransactionsByTaskId(taskId: string): Promise<TransactionHistoryItem[]> {
    const transactions = await this.blockchainEventRepository.findByTaskIds([taskId]);
    return EventMapper.fromDocumentsToApiResponse(transactions);
  }
}
