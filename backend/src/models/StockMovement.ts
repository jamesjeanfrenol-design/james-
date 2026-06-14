import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './Product';
import { User } from './User';

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'enum',
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']
  })
  type: MovementType;

  @Column('decimal', { precision: 12, scale: 6 })
  quantity: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'from_warehouse', length: 50, nullable: true })
  fromWarehouse?: string;

  @Column({ name: 'to_warehouse', length: 50, nullable: true })
  toWarehouse?: string;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @Column({ name: 'value_at_time', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valueAtTime?: number;
}

