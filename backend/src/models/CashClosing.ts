import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('cash_closings')
export class CashClosing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'expected_amount', type: 'decimal', precision: 10, scale: 2 })
  expectedAmount: number;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 10, scale: 2 })
  actualAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  difference: number;

  @Column({ type: 'json' })
  denominations: Record<string, number>;

  @Column({ type: 'datetime' })
  timestamp: Date;
}

