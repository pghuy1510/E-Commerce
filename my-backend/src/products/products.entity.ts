import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from '../categories/categories.entity';
import { ProductOption } from './entities/product-option.entity';
import { ProductVariant } from './entities/product-variant.entity';

export enum ProductType {
  SIMPLE = 'simple',
  VARIABLE = 'variable',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.SIMPLE,
  })
  type!: ProductType;

  @Column({ nullable: true, unique: true })
  sku?: string;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_variant_id' })
  defaultVariant?: ProductVariant | null;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
    price!: number;
  
  @Column('decimal', {
    name: 'max_price',
    nullable: true,
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number | null | undefined) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    },
  })
  maxPrice?: number | null;

  @Column({ name: 'variant_count', type: 'integer', nullable: true, default: 0 })
  variantCount?: number | null;

  @Column()
  stock!: number;

  @Column({ name: 'reserved_stock', default: 0 })
  reservedStock!: number;

  @Column({ nullable: true })
  image!: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => ProductOption, (option) => option.product, { cascade: true })
  options!: ProductOption[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants!: ProductVariant[];
}

