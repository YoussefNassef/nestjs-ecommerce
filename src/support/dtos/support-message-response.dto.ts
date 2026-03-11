import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/auth/enums/role.enum';

export class SupportMessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketId: string;

  @ApiProperty()
  authorUserId: number;

  @ApiProperty({ enum: Role, example: Role.USER })
  authorRole: Role;

  @ApiProperty()
  message: string;

  @ApiProperty()
  isInternal: boolean;

  @ApiProperty()
  createdAt: Date;
}
