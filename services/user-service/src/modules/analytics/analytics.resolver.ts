import { Resolver, Query, Context, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard';
import { TransactionStats, UserStats, TransactionTrend, DashboardOverview } from './dto/analytics.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => TransactionStats, { name: 'transactionStats' })
  async getTransactionStats(@Context() context: any): Promise<TransactionStats> {
    const token = context.req?.headers?.authorization?.replace('Bearer ', '');
    const stats = await this.analyticsService.getTransactionStats(token);
    return {
      totalMint: stats.totalMint || '0.00',
      totalBurn: stats.totalBurn || '0.00',
    };
  }

  @Query(() => UserStats, { name: 'userStats' })
  async getUserStats(): Promise<UserStats> {
    return this.analyticsService.getUserStats();
  }

  @Query(() => [TransactionTrend], { name: 'transactionTrends' })
  async getTransactionTrends(
    @Context() context: any,
    @Args('days', { type: () => Int, nullable: true, defaultValue: 30 }) days?: number,
  ): Promise<TransactionTrend[]> {
    const token = context.req?.headers?.authorization?.replace('Bearer ', '');
    return this.analyticsService.getTransactionTrends(days || 30, token);
  }

  @Query(() => DashboardOverview, { name: 'dashboardOverview' })
  async getDashboardOverview(@Context() context: any): Promise<DashboardOverview> {
    const token = context.req?.headers?.authorization?.replace('Bearer ', '');
    return this.analyticsService.getDashboardOverview(token);
  }
}
