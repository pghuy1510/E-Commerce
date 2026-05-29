import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

import { Cart } from '../../cart/cart.entity';
import { UserAddress } from './user-address.entity';
import { UserBank } from './user-bank.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email?: string;

  @Column()
  password!: string;

  @Column({ name: 'reset_password_token', type: 'varchar', nullable: true })
  resetPasswordToken?: string | null;

  @Column({ name: 'reset_password_expires', type: 'timestamptz', nullable: true })
  resetPasswordExpires?: Date | null;

  @Column({ default: 'user' })
  role!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  last_login?: Date | null;

  @Column('decimal', {
    name: 'total_spent',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalSpent!: number;

  // PROFILE
  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  fullName?: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  gender?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: Date | null;

  // RELATIONS
  @OneToMany(() => Cart, (cart) => cart.user)
  carts!: Cart[];

  @OneToMany(() => UserBank, (bank) => bank.user)
  banks?: UserBank[];

  @OneToMany(() => UserAddress, (address) => address.user, {
    cascade: true,
  })
  addresses?: UserAddress[];
}
