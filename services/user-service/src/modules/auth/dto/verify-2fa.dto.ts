import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @ApiProperty({ example: 'temp-session-token' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;
}
