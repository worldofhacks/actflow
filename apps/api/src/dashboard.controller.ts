import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AgentMapper } from './agents/mappers/agent.mapper';
import { AgentService } from './agents/services/agent.service';
import { AgentDetailsApiResponse } from './agents/types/response/agent-details.response';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { TransactionHistoryItem } from './core/types';
import { UserTransactionsService } from './domain/common/user-transactions.service';
import { NotificationService } from './notification/notification.service';
import { Notification } from './notification/schemas/notification.schema';
import { TaskService } from './task/services/task.service';
import { TaskMapper } from './task/task.mapper';
import { TaskDetailsApiResponse } from './task/types/response/task-details.response';
import { UserService } from './user/services/user.service';
import { WalletService } from './wallet/wallet.service';

interface SellerDashboardApiResponse {
  activeAgents: number;
  averageRating: number;
  performanceOverview: {
    totalEarnings: string;
    totalTasks: number;
  };
  recentTransactions: TransactionHistoryItem[];
  recentNotifications: Notification[];
}

interface BuyerDashboardApiResponse {
  walletBalance: string;
  recentTransactions: TransactionHistoryItem[];
  recentNotifications: Notification[];
  myTasks: TaskDetailsApiResponse[];
  performanceOverview: {
    openDisputes: number;
    totalSpending: string;
    totalTasks: number;
  };
  recommendedAgents: AgentDetailsApiResponse[];
}

interface TransactionsApiResponse {
  escrowedTransactions: TransactionHistoryItem[];
  activePayments: any[];
  completedPayments: any[];
  availableBalance: string;

  activeDisputes: number;
  pendingRefunds: any[];
  pastRefunds: any[];
}

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly userService: UserService,
    private readonly agentService: AgentService,
    private readonly taskService: TaskService,
    private readonly userTransactionsService: UserTransactionsService,
    private readonly notificationService: NotificationService,
    private readonly walletService: WalletService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('seller')
  async sellerDashboard(@Request() req): Promise<SellerDashboardApiResponse> {
    const userId = req.user._id;
    const wallets = await this.userService.getUserWallets(userId);

    const featuredAgents = await this.agentService.getFeaturedAgents();

    const recentTransactions = await this.userTransactionsService.getAllTransactionsForUser(userId);
    const recentNotifications = await this.notificationService.findAll(userId, {
      limit: 5,
    });

    return {
      activeAgents: featuredAgents.length,
      averageRating: 0,
      performanceOverview: {
        totalTasks: 0,
        totalEarnings: '0',
      },
      recentTransactions: recentTransactions,
      recentNotifications,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('buyer')
  async buyerDashboard(@Request() req): Promise<BuyerDashboardApiResponse> {
    const userId = req.user._id;
    const wallets = await this.userService.getUserWallets(userId);
    const walletIds = wallets.map(wallet => wallet.address);
    const walletBalances = await Promise.all(
      wallets.map(wallet => this.walletService.getNativeBalance(wallet.address)),
    );
    const recentTransactions = await this.userTransactionsService.getAllTransactionsForUser(userId);
    const recentNotifications = await this.notificationService.findAll(userId, {
      limit: 5,
    });
    const featuredAgents = await this.agentService.searchAgents({
      isFeatured: true,
    });

    const openDisputes = recentTransactions.filter(
      transaction => transaction.eventName === 'TaskDisputed',
    );
    const totalTasks = recentTransactions.filter(
      transaction => transaction.eventName === 'TaskCreated',
    );

    const tasks = await this.taskService.searchTasks({
      creatorWallets: walletIds,
    });

    return {
      walletBalance: walletBalances.reduce((acc, balance) => acc + Number(balance), 0).toString(),
      performanceOverview: {
        openDisputes: openDisputes.length,
        totalTasks: totalTasks.length,
        totalSpending: '0',
      },
      myTasks: tasks.map(task => TaskMapper.toTaskDetails(task)),
      recentNotifications,
      recentTransactions: recentTransactions,
      recommendedAgents: featuredAgents.map(agent => AgentMapper.toDetailedView(agent)),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('financial')
  async financialDashboard(@Request() req): Promise<TransactionsApiResponse> {
    const userId = req.user._id;

    return {
      pastRefunds: [],
      activePayments: [],
      activeDisputes: 0,
      availableBalance: '',
      escrowedTransactions: [],
      pendingRefunds: [],
      completedPayments: [],
    };
  }
}
