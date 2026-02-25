import { IsString, IsNotEmpty, IsPhoneNumber, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Saudi phone number',
    example: '966512345678',
    pattern: '^9665\\d{8}$',
  })
  @Matches(/^9665\d{8}$/, {
    message: 'Phone must be Saudi number like +9665XXXXXXXX',
  })
  @IsPhoneNumber('SA')
  phone: string;
}
