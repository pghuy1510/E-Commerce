import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Coupon } from '../../coupons/coupon.entity';
import { DealProduct } from './deal-product.entity';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'banner_enabled', type: 'boolean', default: true })
  bannerEnabled!: boolean;

  @Column({ name: 'banner_url', type: 'varchar', length: 500, nullable: true })
  bannerUrl?: string;

  @Column({ name: 'banner_title', type: 'varchar', length: 255, nullable: true })
  bannerTitle?: string;

  @Column({ name: 'banner_subtitle', type: 'varchar', length: 500, nullable: true })
  bannerSubtitle?: string;

  @Column({ name: 'banner_button_text', type: 'varchar', length: 100, nullable: true })
  bannerButtonText?: string;

  @Column({ name: 'banner_button_url', type: 'varchar', length: 500, nullable: true })
  bannerButtonUrl?: string;

  @ManyToMany(() => Coupon)
  @JoinTable({ name: 'deal_featured_coupons' })
  featuredCoupons!: Coupon[];

  @OneToMany(() => DealProduct, (dp) => dp.deal)
  dealProducts!: DealProduct[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
