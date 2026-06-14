import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryAudit } from './InventoryAudit';
import { Product } from './Product';

@Entity('inventory_audit_items')
export class InventoryAuditItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'audit_id' })
  auditId: number;

  @ManyToOne(() => InventoryAudit, audit => audit.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'audit_id' })
  audit: InventoryAudit;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'system_qty', type: 'int' })
  systemQty: number;

  @Column({ name: 'physical_qty', type: 'int' })
  physicalQty: number;

  @Column('int')
  difference: number;
}

