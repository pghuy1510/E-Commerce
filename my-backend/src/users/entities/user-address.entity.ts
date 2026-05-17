import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  province?: string;

  @Column({ type: 'varchar', nullable: true })
  district?: string;

  @Column({ type: 'varchar', nullable: true })
  ward?: string;

  @Column({ type: 'text', nullable: true })
  detail?: string;

  // FK + relation (CHỈ DÙNG 1 CHỖ, KHÔNG DUPLICATE userId)
  @OneToOne(() => User, (user) => user.address, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
