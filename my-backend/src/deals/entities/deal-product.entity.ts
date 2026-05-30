import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Deal } from './deal.entity';
import { Product } from '../../products/products.entity';

@Entity('deal_products')
export class DealProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Deal, (deal) => deal.dealProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deal_id' })
  deal!: Deal;

  @Column({ name: 'deal_id' })
  dealId!: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  dealPrice!: number;

  @Column({ name: 'deal_stock', type: 'int', default: 0 })
  dealStock!: number;

  @Column({ name: 'sold_count', type: 'int', default: 0 })
  soldCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
