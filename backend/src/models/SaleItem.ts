import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './Sale';
import { Product } from './Product';
import { Unit } from './Unit';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_id' })
  saleId: number;

  @ManyToOne(() => Sale, sale => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column('decimal', { precision: 12, scale: 6 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'unit_type', type: 'enum', enum: ['SALE', 'PURCHASE'], nullable: true, default: 'SALE' })
  unitType?: 'SALE' | 'PURCHASE';

  @Column({ name: 'sale_unit_id', nullable: true })
  saleUnitId?: number;

  @ManyToOne(() => Unit, { nullable: true })
  @JoinColumn({ name: 'sale_unit_id' })
  saleUnit?: Unit;
}

