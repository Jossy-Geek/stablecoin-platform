import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../shared/database/entities/user-role.entity';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: '+1' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({ example: 'captcha-token', description: 'Required only if IS_CAPTCHA=true' })
  @IsString()
  @IsOptional()
  captchaToken?: string;
}
