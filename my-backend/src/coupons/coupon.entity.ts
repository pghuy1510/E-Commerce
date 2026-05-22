import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export const COUPON_TYPES = ['platform', 'shop', 'shipping'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

@Entity('coupons')
@Index('idx_coupons_code', ['code'], { unique: true })
@Index('idx_coupons_expires_at', ['expiresAt'])
export class Coupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  code!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: 'enum', enum: COUPON_TYPES, default: 'platform' })
  type!: CouponType;

  @Column({ type: 'enum', enum: DISCOUNT_TYPES, default: 'percentage' })
  discountType!: DiscountType;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  discountValue!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  minOrder?: number | null;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  maxDiscount?: number | null;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId!: number | null;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt?: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
