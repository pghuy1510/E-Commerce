import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column({ name: 'product_name' })
  productName!: string;

  @Column({ name: 'variant_id', type: 'integer', nullable: true })
  variantId?: number | null;

  @Column({ name: 'variant_name', type: 'varchar', nullable: true })
  variantName?: string | null;

  @Column({ name: 'variant_sku', type: 'varchar', nullable: true })
  variantSku?: string | null;

  @Column({ name: 'variant_options', type: 'jsonb', nullable: true })
  variantOptions?: Record<string, string> | null;

  @Column()
  quantity!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}

