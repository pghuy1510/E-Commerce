import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Cart } from '../../cart/cart.entity';
import { UserAddress } from './user-address.entity';
import { UserBank } from './user-bank.entity';
import { UserProfile } from './user-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true, nullable: true, type: 'varchar', length: 255 })
  email?: string | null;

  @Column()
  password!: string;

  @Column({ default: 'user' })
  role!: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts!: Cart[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;

  @OneToOne(() => UserAddress, (address) => address.user)
  address?: UserAddress;

  @OneToMany(() => UserBank, (bank) => bank.user)
  banks?: UserBank[];
}
