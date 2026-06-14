import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RechargeType } from './RechargeType';

@Entity('recharge_stocks')
export class RechargeStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recharge_type_id' })
  rechargeTypeId: number;

  @ManyToOne(() => RechargeType)
  @JoinColumn({ name: 'recharge_type_id' })
  rechargeType: RechargeType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  quantity: number; // Montant en stock (en Ar)

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;
}

