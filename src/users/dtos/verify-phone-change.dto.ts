import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyPhoneChangeDto {
  @ApiProperty({
    description: 'Phone number that received the OTP',
    example: '966512345678',
    pattern: '^9665\\d{8}$',
  })
  @IsString()
  @Matches(/^9665\d{8}$/, {
    message: 'Phone must be Saudi number like 9665XXXXXXXX',
  })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
