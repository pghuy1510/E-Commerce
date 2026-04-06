import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_behaviors')
export class UserBehavior {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  product_id!: number;

  @Column()
  action!: string;

  @Column({ default: 1 })
  weight!: number;

  @CreateDateColumn()
  created_at!: Date;
}
