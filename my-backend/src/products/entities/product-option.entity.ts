import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Product } from '../products.entity';

@Entity('product_options')
export class ProductOption {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string; // e.g. "Format", "Color", "Size"

  @Column({ type: 'jsonb', default: [] })
  values!: string[]; // e.g. ["Hardcover", "Paperback", "PDF"]

  @ManyToOne(() => Product, (product) => product.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_id' })
  productId!: number;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}

