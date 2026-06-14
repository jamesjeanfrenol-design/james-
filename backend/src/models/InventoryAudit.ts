import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { InventoryAuditItem } from './InventoryAuditItem';

@Entity('inventory_audits')
export class InventoryAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @OneToMany(() => InventoryAuditItem, item => item.audit, { cascade: true })
  items: InventoryAuditItem[];
}

