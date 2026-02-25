import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('otp_codes')
export class OtpCode {
  @ApiProperty({
    description: 'Unique OTP identifier',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Phone number for OTP verification',
    example: '966512345678',
    maxLength: 20,
  })
  @Column({ length: 20 })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    maxLength: 6,
  })
  @Column({ length: 6 })
  code: string;

  @ApiProperty({
    description: 'OTP expiration timestamp',
    example: '2024-01-21T10:35:00Z',
  })
  @Column()
  expiresAt: Date;

  @ApiProperty({
    description: 'Whether the OTP has been verified',
    example: false,
  })
  @Column({ default: false })
  verified: boolean;

  @ApiProperty({
    description: 'OTP creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
