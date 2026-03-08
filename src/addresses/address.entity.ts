import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('addresses')
export class Address {
  @ApiProperty({
    description: 'Unique address identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ example: 'Home' })
  @Column({ type: 'varchar', length: 64 })
  label: string;

  @ApiProperty({ example: 'Ahmed Ali' })
  @Column({ type: 'varchar', length: 120 })
  recipientName: string;

  @ApiProperty({ example: '966512345678' })
  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @ApiProperty({ example: 'King Fahd Rd, Building 10' })
  @Column({ type: 'varchar', length: 255 })
  line1: string;

  @ApiPropertyOptional({ example: 'Apt 15' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  line2?: string | null;

  @ApiProperty({ example: 'Riyadh' })
  @Column({ type: 'varchar', length: 120 })
  city: string;

  @ApiPropertyOptional({ example: 'Riyadh Region' })
  @Column({ type: 'varchar', length: 120, nullable: true })
  state?: string | null;

  @ApiPropertyOptional({ example: '12345' })
  @Column({ type: 'varchar', length: 32, nullable: true })
  postalCode?: string | null;

  @ApiProperty({ example: 'SA' })
  @Column({ type: 'varchar', length: 2, default: 'SA' })
  country: string;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
