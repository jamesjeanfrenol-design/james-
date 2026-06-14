import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('recharge_types')
export class RechargeType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Ex: "Orange", "Telma", "Airtel"

  @Column({ nullable: true })
  provider?: string; // Nom du fournisseur

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

