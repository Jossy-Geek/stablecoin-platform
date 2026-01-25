import { IsString, MinLength, IsNotEmpty, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  twoFactorCode: string;
}
