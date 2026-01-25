import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty({ example: '+1' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ example: 'captcha-token', required: false })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
