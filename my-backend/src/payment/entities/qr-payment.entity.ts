import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from '../../order/order.entity';
import { Payment } from './payment.entity';

@Entity('qr_payments')
@Index('idx_qr_payments_token', ['qrToken'], { unique: true })
@Index('idx_qr_payments_payment', ['payment'])
@Index('idx_qr_payments_order', ['order'])
export class QrPayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ name: 'qr_token', type: 'varchar', length: 64 })
  qrToken!: string;

  @Column({ name: 'bank_name', type: 'varchar' })
  bankName!: string;

  @Column({ name: 'account_name', type: 'varchar' })
  accountName!: string;

  @Column({ name: 'account_number', type: 'varchar' })
  accountNumber!: string;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount!: number;

  @Column({ name: 'add_info', type: 'varchar' })
  addInfo!: string;

  @Column({ name: 'qr_data_url', type: 'text' })
  qrDataUrl!: string;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expiredAt?: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
