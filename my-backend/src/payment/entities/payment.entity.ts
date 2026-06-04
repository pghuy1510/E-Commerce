import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @Column()
  method!: string; // COD | MOMO | VNPAY

  @Column('decimal')
  amount!: number;

  @Column({ default: 'pending' })
  status!: string; // pending | paid | failed | expired | refunded

  @Column({ nullable: true })
  transaction_id!: string;

  @Column({ name: 'token_hash', nullable: true })
  tokenHash?: string;

  @Column({ name: 'payment_code', type: 'varchar', unique: true, nullable: true })
  paymentCode?: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paid_at?: Date | null;

  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expired_at?: Date | null;
  @CreateDateColumn()
  created_at!: Date;
}
