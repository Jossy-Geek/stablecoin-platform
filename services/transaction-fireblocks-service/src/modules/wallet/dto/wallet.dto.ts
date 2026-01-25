import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepositDto {
  @ApiProperty({ example: '1000.00', description: 'Amount to deposit' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'Deposit from external wallet', description: 'Transaction note' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateWithdrawDto {
  @ApiProperty({ example: '500.00', description: 'Amount to withdraw' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', description: 'Destination address' })
  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @ApiPropertyOptional({ example: 'Withdraw to external wallet', description: 'Transaction note' })
  @IsString()
  @IsOptional()
  note?: string;
}
