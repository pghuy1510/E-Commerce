import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Cart } from '../../cart/cart.entity';

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
}
