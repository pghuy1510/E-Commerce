import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_shipping_addresses')
@Index('idx_order_shipping_order', ['order'])
export class OrderShippingAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'receiver_name', type: 'varchar' })
  receiverName!: string;

  @Column({ name: 'receiver_phone', type: 'varchar' })
  receiverPhone!: string;

  @Column({ type: 'varchar' })
  province!: string;

  @Column({ type: 'varchar' })
  district!: string;

  @Column({ type: 'varchar' })
  ward!: string;

  @Column({ type: 'text' })
  detail!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
