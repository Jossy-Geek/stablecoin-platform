import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly transactionApiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.transactionApiUrl = this.configService.get('TRANSACTION_API_URL') || 'http://localhost:3003';
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response: AxiosResponse<{ totalMint: string; totalBurn: string }> = await axios.get(
        `${this.transactionApiUrl}/transactions/stats`,
        { headers },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching transaction stats: ${error.message}`);
      return { totalMint: '0.00', totalBurn: '0.00' };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      // Access the underlying TypeORM repository
      const repository = (this.userRepository as any).repository;
      
      const totalUsers = await repository.count();
      const activeUsers = await repository
        .createQueryBuilder('user')
        .innerJoin('user.userRoles', 'role')
        .where('role.isActive = :isActive', { isActive: true })
        .andWhere('role.isBlocked = :isBlocked', { isBlocked: false })
        .getCount();

      const adminUsers = await repository
        .createQueryBuilder('user')
        .innerJoin('user.userRoles', 'role')
        .where('role.role IN (:...roles)', { roles: ['admin', 'super_admin'] })
        .andWhere('role.isActive = :isActive', { isActive: true })
        .getCount();

      const recentUsers = await repository
        .createQueryBuilder('user')
        .orderBy('user.createdAt', 'DESC')
        .limit(10)
        .getMany();

      return {
        totalUsers,
        activeUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          createdAt: u.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching user stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transaction trends (last N days)
   */
  async getTransactionTrends(days: number = 30, token?: string) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch transactions from transaction service
      const response: AxiosResponse<{ data: any[] }> = await axios.get(
        `${this.transactionApiUrl}/transactions`,
        {
          headers,
          params: {
            page: 1,
            limit: 1000, // Adjust based on your needs
          },
        },
      );

      const transactions = response.data?.data || [];
      
      // Group by date
      const trends: { [key: string]: { mint: number; burn: number; deposit: number; withdraw: number } } = {};
      
      transactions.forEach((tx: any) => {
        const date = new Date(tx.createdAt).toISOString().split('T')[0];
        if (!trends[date]) {
          trends[date] = { mint: 0, burn: 0, deposit: 0, withdraw: 0 };
        }
        
        const amount = parseFloat(tx.amount || '0');
        switch (tx.transactionType) {
          case 'mint':
            trends[date].mint += amount;
            break;
          case 'burn':
            trends[date].burn += amount;
            break;
          case 'deposit':
            trends[date].deposit += amount;
            break;
          case 'withdraw':
            trends[date].withdraw += amount;
            break;
        }
      });

      // Convert to array format
      const trendArray = Object.entries(trends).map(([date, values]) => ({
        date,
        ...values,
      }));

      return trendArray.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      this.logger.error(`Error fetching transaction trends: ${error.message}`);
      return [];
    }
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(token?: string) {
    try {
      const [transactionStats, userStats, trends] = await Promise.all([
        this.getTransactionStats(token),
        this.getUserStats(),
        this.getTransactionTrends(30, token),
      ]);

      return {
        transactions: transactionStats,
        users: userStats,
        trends: trends.slice(-7), // Last 7 days
      };
    } catch (error) {
      this.logger.error(`Error fetching dashboard overview: ${error.message}`);
      throw error;
    }
  }
}
