import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { User } from '../users/entities/user.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.carts)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items!: CartItem[];
}