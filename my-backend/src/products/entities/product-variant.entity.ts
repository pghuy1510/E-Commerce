import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Product } from '../products.entity';

@Entity('product_variants')
@Index('idx_variant_options', ['options'], { synchronize: false } as any)
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'product_id' })
  productId!: number;

  @Column({ unique: true, nullable: true })
  sku?: string;

  @Column()
  name!: string; // e.g. "Hardcover" or "Paperback"

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column()
  stock!: number;

  @Column({ name: 'reserved_stock', default: 0 })
  reservedStock!: number;

  @Column({ nullable: true })
  image?: string;

  @Column('jsonb')
  options!: Record<string, string>; // e.g. { "Format": "Hardcover" }

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}

