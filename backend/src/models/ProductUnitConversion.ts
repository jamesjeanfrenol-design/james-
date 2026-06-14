import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './Product';
import { Unit } from './Unit';

@Entity('product_unit_conversions')
export class ProductUnitConversion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, product => product.unitConversions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'unit_id' })
  unitId: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column('decimal', { name: 'conversion_ratio', precision: 12, scale: 6 })
  conversionRatio: number;

  @Column({ name: 'custom_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  customPrice?: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;
}

