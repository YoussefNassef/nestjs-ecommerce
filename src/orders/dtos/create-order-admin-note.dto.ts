import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateOrderAdminNoteDto {
  @ApiProperty({
    description: 'Admin note attached to order operations timeline',
    example: 'Customer requested priority handling.',
  })
  @IsString()
  @Length(1, 500)
  note: string;
}

