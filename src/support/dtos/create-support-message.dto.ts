import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateSupportMessageDto {
  @ApiProperty({
    description: 'Support ticket message body',
    example: 'Any update on this case?',
  })
  @IsString()
  @Length(1, 1000)
  message: string;

  @ApiPropertyOptional({
    description: 'When true, message is internal and visible to admins only',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
