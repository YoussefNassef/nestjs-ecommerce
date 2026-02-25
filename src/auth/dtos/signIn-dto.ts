import { IsPhoneNumber, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    description: 'Saudi phone number in format 9665XXXXXXXX',
    example: '966512345678',
    pattern: '^9665\\d{8}$',
  })
  @Matches(/^9665\d{8}$/, {
    message: 'Phone must be Saudi number like +9665XXXXXXXX',
  })
  @IsPhoneNumber('SA')
  phone: string;
}
