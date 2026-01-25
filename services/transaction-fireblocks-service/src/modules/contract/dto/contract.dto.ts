import { IsString, IsBoolean, IsOptional, IsNotEmpty, Matches, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ description: 'Contract address (42 characters, starts with 0x)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid contract address format' })
  contractAddress: string;

  @ApiProperty({ description: 'Contract name' })
  @IsString()
  @IsNotEmpty()
  contractName: string;

  @ApiProperty({ description: 'Network name (e.g., ethereum, polygon)' })
  @IsString()
  @IsNotEmpty()
  network: string;

  @ApiPropertyOptional({ description: 'Total supply' })
  @IsOptional()
  @IsNumberString()
  totalSupply?: string;

  @ApiPropertyOptional({ description: 'Deployment timestamp' })
  @IsOptional()
  deployedAt?: Date;
}

export class UpdateContractDto {
  @ApiPropertyOptional({ description: 'Contract name' })
  @IsOptional()
  @IsString()
  contractName?: string;

  @ApiPropertyOptional({ description: 'Network name' })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiPropertyOptional({ description: 'Total supply' })
  @IsOptional()
  @IsNumberString()
  totalSupply?: string;

  @ApiPropertyOptional({ description: 'Pause status' })
  @IsOptional()
  @IsBoolean()
  isPaused?: boolean;
}

export class TogglePauseDto {
  @ApiProperty({ description: 'Pause status (true to pause, false to resume)' })
  @IsBoolean()
  @IsNotEmpty()
  isPaused: boolean;
}
