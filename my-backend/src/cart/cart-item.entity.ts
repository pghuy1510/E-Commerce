import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../products/products.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

@Entity('cart_items')
@Index('idx_cart_item_simple', ['cart', 'product'], { unique: true, where: 'variant_id IS NULL' })
@Index('idx_cart_item_variant', ['cart', 'product', 'variant'], { unique: true, where: 'variant_id IS NOT NULL' })
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => ProductVariant, { eager: true, nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant | null;

  @Column({ default: 1 })
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at!: Date;
}

