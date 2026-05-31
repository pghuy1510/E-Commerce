import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatusLog } from './order-status-log.entity';

@Entity('orders')
@Index('idx_orders_created_at', ['created_at'])
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ name: 'guest_email', type: 'varchar', nullable: true })
  guestEmail?: string | null;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalAmount!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  subtotalAmount!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  discountAmount!: number;

  @Column('decimal', {
    name: 'shipping_fee',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  shippingFee!: number;

  @Column('simple-array', { nullable: true })
  couponCodes?: string[];

  @Column({ name: 'payment_method', type: 'varchar', nullable: true })
  paymentMethod?: string | null;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @Column({ name: 'tracking_number', type: 'varchar', nullable: true })
  trackingNumber?: string | null;

  @Column({ name: 'estimated_delivery_date', type: 'timestamptz', nullable: true })
  estimatedDeliveryDate?: Date | null;

  @OneToMany(() => OrderStatusLog, (log) => log.order, { cascade: true })
  statusLogs!: OrderStatusLog[];
}
