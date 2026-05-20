import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Coupon } from './coupon.entity';

@Entity('user_coupons')
@Unique(['code'])
@Index('idx_user_coupons_user_id', ['user'])
@Index('idx_user_coupons_expires_at', ['expiresAt'])
export class UserCoupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coupon_id' })
  coupon!: Coupon;

  @Column()
  code!: string;

  @Column({ name: 'source', type: 'varchar', nullable: true })
  source?: string | null;

  @Column({ name: 'is_used', default: false })
  isUsed!: boolean;

  @Column({ name: 'used_count', default: 0 })
  usedCount!: number;

  @Column({ name: 'usage_limit', default: 1 })
  usageLimit!: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt?: Date | null;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt!: Date;
}
