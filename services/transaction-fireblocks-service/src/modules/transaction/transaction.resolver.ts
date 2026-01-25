import { Resolver, Query, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthWithBlockCheckGuard } from '../../shared/guards/jwt-auth-with-block-check.guard';
import { Transaction, PaginatedTransactions, TransactionStats, TransactionFilters } from './dto/transaction-graphql.dto';
import { TransactionType, TransactionStatus } from '../../shared/database/entities/transaction.entity';

@Resolver(() => Transaction)
@UseGuards(JwtAuthWithBlockCheckGuard)
export class TransactionResolver {
  constructor(private readonly transactionService: TransactionService) {}

  @Query(() => PaginatedTransactions, { name: 'transactions' })
  async getTransactions(
    @Context() context: any,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @Args('filters', { nullable: true, type: () => TransactionFilters }) filters?: TransactionFilters,
  ): Promise<PaginatedTransactions> {
    const req = context.req;
    
    // Check if user is admin or super_admin - admins can see all transactions
    const userId = req.user.role === 'admin' || req.user.role === 'super_admin' ? undefined : req.user.userId;
    
    const result = await this.transactionService.getTransactions({
      userId,
      page,
      limit,
      status: filters?.status,
      transactionType: filters?.transactionType,
      id: filters?.id,
      amount: filters?.amount,
      currency: filters?.currency,
      txHash: filters?.txHash,
    });

    return {
      data: result.data.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        transactionType: tx.transactionType,
        amount: tx.amount,
        currency: tx.currency,
        toCurrency: tx.toCurrency,
        status: tx.status,
        txHash: tx.txHash,
        note: tx.note,
        destinationAddress: tx.destinationAddress,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      })),
      total: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    };
  }

  @Query(() => TransactionStats, { name: 'transactionStats' })
  async getTransactionStats(@Context() context: any): Promise<TransactionStats> {
    const req = context.req;
    
    // Check if user is admin or super_admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    return this.transactionService.getTransactionStats();
  }
}
