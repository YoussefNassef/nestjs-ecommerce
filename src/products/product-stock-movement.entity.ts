import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './products.entity';
import { StockAdjustmentReason } from './enums/stock-adjustment-reason.enum';

@Entity('product_stock_movements')
@Index('IDX_product_stock_movements_product_created_at', ['productId', 'createdAt'])
export class ProductStockMovement {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440111',
  })
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiProperty({ example: 12 })
  @Column({ type: 'int' })
  previousStock: number;

  @ApiProperty({ example: 5, description: 'Positive or negative stock change' })
  @Column({ type: 'int' })
  delta: number;

  @ApiProperty({ example: 17 })
  @Column({ type: 'int' })
  newStock: number;

  @ApiProperty({ enum: StockAdjustmentReason, example: StockAdjustmentReason.RESTOCK })
  @Column({
    type: 'varchar',
    length: 32,
    default: StockAdjustmentReason.MANUAL,
  })
  reason: StockAdjustmentReason;

  @ApiPropertyOptional({ example: 'Supplier invoice #INV-203' })
  @Column({ type: 'varchar', length: 128, nullable: true })
  reference?: string | null;

  @ApiPropertyOptional({ example: 'Warehouse shelf count correction' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  note?: string | null;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  createdByAdminUserId: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}

