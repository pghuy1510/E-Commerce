import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('payment_logs')
@Index('idx_payment_logs_payment', ['payment'])
export class PaymentLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ type: 'varchar' })
  provider!: string;

  @Column({ name: 'provider_transaction_id', type: 'varchar', nullable: true })
  providerTransactionId?: string | null;

  @Column({ name: 'raw_response', type: 'jsonb' })
  rawResponse!: Record<string, unknown>;

  @Column({ type: 'varchar' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
