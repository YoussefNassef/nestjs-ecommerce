import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Saudi phone number to send OTP to',
    example: '966512345678',
    pattern: '^9665\\d{8}$',
  })
  @IsString()
  @Matches(/^9665\d{8}$/, {
    message: 'Phone must be Saudi number like 9665XXXXXXXX',
  })
  phone: string;
}
