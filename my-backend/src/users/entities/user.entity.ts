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

  @Column({ default: 'user' })
  role!: string;

  @CreateDateColumn()
  created_at!: Date;

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

  @OneToOne(() => UserAddress, (address) => address.user, {
    cascade: true,
  })
  address?: UserAddress;
}
