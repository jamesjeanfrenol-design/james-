import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Customer } from './Customer';
import { SaleItem } from './SaleItem';

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE' | 'BALANCE' | 'MIXED';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: ['CASH', 'CARD', 'MOBILE', 'BALANCE', 'MIXED']
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2 })
  paidAmount: number;

  @Column({ name: 'credit_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditAmount: number;

  @Column({ name: 'received_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  receivedAmount?: number;

  @Column({ name: 'change_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  changeAmount?: number;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @OneToMany(() => SaleItem, saleItem => saleItem.sale, { cascade: true })
  items: SaleItem[];
}

