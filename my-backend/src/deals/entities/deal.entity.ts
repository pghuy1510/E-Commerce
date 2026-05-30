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
