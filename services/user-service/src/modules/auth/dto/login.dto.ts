import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: 'user', description: 'Role to login with (user, admin, super_admin). Note: Not used for /auth/admin/login endpoint - backend determines role automatically' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 'captcha-token', description: 'Required only if IS_CAPTCHA=true' })
  @IsString()
  @IsOptional()
  captchaToken?: string;
}
