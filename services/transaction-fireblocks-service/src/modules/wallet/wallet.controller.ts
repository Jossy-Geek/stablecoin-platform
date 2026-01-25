import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateDepositDto, CreateWithdrawDto } from './dto/wallet.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { JwtAuthWithBlockCheckGuard } from '../../shared/guards/jwt-auth-with-block-check.guard';
import { TransactionType, TransactionStatus } from '../../shared/database/entities/transaction.entity';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthWithBlockCheckGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get user wallet balance' })
  async getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get('info')
  @ApiOperation({ summary: 'Get complete wallet information' })
  async getWalletInfo(@Request() req) {
    return this.walletService.getWalletInfo(req.user.userId);
  }

  @Get('deposit-address')
  @ApiOperation({ summary: 'Get or create deposit address for user' })
  async getDepositAddress(@Request() req) {
    return this.walletService.getDepositAddress(req.user.userId);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Create deposit transaction' })
  async createDeposit(@Request() req, @Body() createDepositDto: CreateDepositDto) {
    return this.walletService.createDeposit(req.user.userId, createDepositDto);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Create withdraw transaction' })
  async createWithdraw(@Request() req, @Body() createWithdrawDto: CreateWithdrawDto) {
    return this.walletService.createWithdraw(req.user.userId, createWithdrawDto);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get a single transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID', type: String })
  async getTransactionById(@Request() req, @Param('id') id: string) {
    return this.walletService.getTransactionById(req.user.userId, id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get user transaction history with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'transactionType', required: false, enum: TransactionType })
  async getTransactions(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('transactionType') transactionType?: string,
  ) {
    return this.walletService.getUserTransactions(req.user.userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
      transactionType: transactionType as TransactionType,
    });
  }
}
