import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './Category';
import { Unit } from './Unit';
import { ProductUnitConversion } from './ProductUnitConversion';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  sku: string;

  @Column()
  barcode: string;

  @Column({ nullable: true })
  barcode2?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'wholesale_price', type: 'decimal', precision: 10, scale: 2 })
  wholesalePrice: number;

  @Column({ name: 'wholesale_threshold', type: 'int' })
  wholesaleThreshold: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column('decimal', { name: 'stock_magasin', precision: 12, scale: 6, default: 0 })
  stockMagasin: number;

  @Column('decimal', { name: 'stock_principal', precision: 12, scale: 6, default: 0 })
  stockPrincipal: number;

  @Column('decimal', { name: 'min_stock', precision: 12, scale: 6, default: 0 })
  minStock: number;

  @Column({ name: 'unit_id' })
  unitId: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'purchase_unit_id' })
  purchaseUnitId: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'purchase_unit_id' })
  purchaseUnit: Unit;

  @Column({ name: 'conversion_ratio', type: 'decimal', precision: 10, scale: 2, default: 1 })
  conversionRatio: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ name: 'is_favorite', type: 'boolean', default: false })
  isFavorite: boolean;

  @OneToMany(() => ProductUnitConversion, conversion => conversion.product)
  unitConversions: ProductUnitConversion[];
}

