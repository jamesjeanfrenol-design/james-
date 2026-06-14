import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RechargeType } from './RechargeType';
import { Customer } from './Customer';
import { User } from './User';

@Entity('recharge_sales')
export class RechargeSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recharge_type_id' })
  rechargeTypeId: number;

  @ManyToOne(() => RechargeType)
  @JoinColumn({ name: 'recharge_type_id' })
  rechargeType: RechargeType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // Montant vendu (en Ar)

  @Column({ name: 'customer_id', nullable: true })
  customerId?: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}

