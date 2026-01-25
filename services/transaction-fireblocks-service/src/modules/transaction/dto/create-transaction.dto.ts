import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../../shared/database/entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType;

  @ApiProperty({ example: '100.00' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'STC' })
  @IsString()
  @IsOptional()
  toCurrency?: string;

  @ApiPropertyOptional({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', description: 'Destination address for withdraw transactions' })
  @IsString()
  @IsOptional()
  destinationAddress?: string;

  @ApiPropertyOptional({ example: 'Transaction note', description: 'Optional note for the transaction' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class AddBalanceDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '1000.00' })
  @IsString()
  @IsNotEmpty()
  amount: string;
}
