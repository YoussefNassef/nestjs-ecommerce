import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/auth/enums/role.enum';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: '966512345678' })
  phone: string;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @ApiProperty({ example: '2024-01-21T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-21T10:30:00Z' })
  updatedAt: Date;
}
