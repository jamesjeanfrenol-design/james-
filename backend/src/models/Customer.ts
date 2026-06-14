import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}

