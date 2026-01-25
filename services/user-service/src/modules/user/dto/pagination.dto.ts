import { IsOptional, IsInt, Min, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../shared/database/entities/user-role.entity';

export class PaginationDto {
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

  @ApiPropertyOptional({ example: 'john', description: 'General search across multiple fields' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  // Column-specific filters
  @ApiPropertyOptional({ example: 'USR-123456', description: 'Filter by display ID' })
  @IsString()
  @IsOptional()
  displayId?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Filter by email' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'John', description: 'Filter by first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Filter by last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+1', description: 'Filter by country code' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Filter by mobile number' })
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by active/verified status' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
