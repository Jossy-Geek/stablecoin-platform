import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, AddBalanceDto } from './dto/create-transaction.dto';
import { TransactionPaginationDto } from './dto/pagination.dto';
import { TransactionType, TransactionStatus } from '../../shared/database/entities/transaction.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { JwtAuthWithBlockCheckGuard } from '../../shared/guards/jwt-auth-with-block-check.guard';

@ApiTags('Transaction')
@Controller('transactions')
@UseGuards(JwtAuthWithBlockCheckGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('add-balance')
  @ApiOperation({ summary: 'Add wallet balance manually (Admin only)' })
  async addBalance(@Request() req, @Body() addBalanceDto: AddBalanceDto) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.transactionService.addBalanceManually(
      addBalanceDto.userId,
      addBalanceDto.amount,
    );
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Create deposit transaction' })
  async deposit(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.createTransaction(req.user.userId, {
      ...createTransactionDto,
      transactionType: TransactionType.DEPOSIT,
    });
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Create withdraw transaction' })
  async withdraw(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.createTransaction(req.user.userId, {
      ...createTransactionDto,
      transactionType: TransactionType.WITHDRAW,
    });
  }

  @Post('mint')
  @ApiOperation({ summary: 'Create mint transaction' })
  async mint(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.createTransaction(req.user.userId, {
      ...createTransactionDto,
      transactionType: TransactionType.MINT,
    });
  }

  @Post('burn')
  @ApiOperation({ summary: 'Create burn transaction' })
  async burn(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.createTransaction(req.user.userId, {
      ...createTransactionDto,
      transactionType: TransactionType.BURN,
    });
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user balance' })
  async getBalance(@Request() req) {
    return this.transactionService.getUserBalance(req.user.userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get transaction history' })
  async getHistory(@Request() req) {
    return this.transactionService.getUserTransactions(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get transactions list with pagination and column filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'transactionType', required: false, enum: TransactionType })
  @ApiQuery({ name: 'id', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'amount', required: false, type: String })
  @ApiQuery({ name: 'currency', required: false, type: String })
  @ApiQuery({ name: 'toCurrency', required: false, type: String })
  @ApiQuery({ name: 'txHash', required: false, type: String })
  async getTransactions(
    @Request() req,
    @Query() paginationDto: TransactionPaginationDto,
  ) {
    // Check if user is admin or super_admin - admins can see all transactions
    const userId = req.user.role === 'admin' || req.user.role === 'super_admin' ? undefined : req.user.userId;
    
    return this.transactionService.getTransactions({
      userId,
      page: paginationDto.page || 1,
      limit: paginationDto.limit || 10,
      search: paginationDto.search,
      status: paginationDto.status,
      transactionType: paginationDto.transactionType,
      id: paginationDto.id,
      amount: paginationDto.amount,
      currency: paginationDto.currency,
      toCurrency: paginationDto.toCurrency,
      txHash: paginationDto.txHash,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics (total mint, total burn)' })
  async getTransactionStats(@Request() req) {
    return this.transactionService.getTransactionStats();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve pending transaction (Admin only)' })
  async approveTransaction(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.transactionService.confirmTransaction(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject pending transaction (Admin only)' })
  async rejectTransaction(@Request() req, @Param('id') id: string, @Body() body: { reason?: string }) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin or Super Admin access required');
    }
    return this.transactionService.rejectTransaction(id, body.reason);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransaction(@Param('id') id: string) {
    return this.transactionService.getTransactionById(id);
  }
}
