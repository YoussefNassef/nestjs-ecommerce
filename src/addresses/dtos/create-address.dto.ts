import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @Length(1, 64)
  label: string;

  @ApiProperty({ example: 'Ahmed Ali' })
  @IsString()
  @Length(1, 120)
  recipientName: string;

  @ApiProperty({ example: '966512345678' })
  @IsString()
  @Length(6, 32)
  phone: string;

  @ApiProperty({ example: 'King Fahd Rd, Building 10' })
  @IsString()
  @Length(1, 255)
  line1: string;

  @ApiPropertyOptional({ example: 'Apt 15' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  line2?: string;

  @ApiProperty({ example: 'Riyadh' })
  @IsString()
  @Length(1, 120)
  city: string;

  @ApiPropertyOptional({ example: 'Riyadh Region' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  state?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  postalCode?: string;

  @ApiProperty({ example: 'SA' })
  @IsString()
  @Length(2, 64)
  country: string;
}
