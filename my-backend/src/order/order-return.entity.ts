import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_returns')
export class OrderReturn {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ name: 'image_proof', type: 'text', nullable: true })
  imageProof?: string | null;

  @Column({ default: 'return_requested' })
  status!: 'return_requested' | 'return_approved' | 'product_received' | 'refund_processing' | 'refunded' | 'return_rejected' | 'return_cancelled';

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ name: 'refund_transaction_id', type: 'varchar', nullable: true })
  refundTransactionId?: string | null;

  @Column({ name: 'refund_method', type: 'varchar', nullable: true })
  refundMethod?: string | null;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt?: Date | null;

  @Column('decimal', {
    name: 'refund_amount',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  refundAmount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
