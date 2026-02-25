import { Order } from 'src/orders/entities/orders.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/auth/enums/role.enum';
import { Review } from 'src/reviews/review.entity';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @Column()
  fullName: string;

  @ApiProperty({
    description: 'Saudi phone number',
    example: '966512345678',
  })
  @Column({ unique: true })
  phone: string;

  @ApiProperty({
    description: 'Whether the user phone is verified',
    example: true,
  })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: 'User orders',
    type: () => [Order],
  })
  @OneToMany(() => Order, (o) => o.user)
  orders: Order[];

  @ApiProperty({
    description: 'User product reviews',
    type: () => [Review],
  })
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @ApiProperty({
    description: 'User shopping cart',
    type: () => Cart,
  })
  @OneToOne(() => Cart, (c) => c.user)
  cart: Cart;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
