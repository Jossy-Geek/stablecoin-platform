import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '../../../shared/database/entities/transaction.entity';

export class TransactionPaginationDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'search term', description: 'General search across multiple fields' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: TransactionStatus, example: TransactionStatus.PENDING })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({ enum: TransactionType, example: TransactionType.MINT })
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  // Column-specific filters
  @ApiPropertyOptional({ example: 'a0000000-0000-0000-0000-000000000001', description: 'Filter by transaction ID' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: '100.00', description: 'Filter by amount' })
  @IsString()
  @IsOptional()
  amount?: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Filter by currency' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'STC', description: 'Filter by to currency' })
  @IsString()
  @IsOptional()
  toCurrency?: string;

  @ApiPropertyOptional({ example: '0xabc123...', description: 'Filter by transaction hash' })
  @IsString()
  @IsOptional()
  txHash?: string;
}
