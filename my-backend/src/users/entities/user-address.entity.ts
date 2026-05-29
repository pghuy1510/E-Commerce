import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'receiver_name', type: 'varchar', nullable: true })
  receiverName?: string;

  @Column({ name: 'receiver_phone', type: 'varchar', nullable: true })
  receiverPhone?: string;

  @Column({ type: 'varchar', nullable: true })
  province?: string;

  @Column({ type: 'varchar', nullable: true })
  district?: string;

  @Column({ type: 'varchar', nullable: true })
  ward?: string;

  @Column({ type: 'text', nullable: true })
  detail?: string;

  @Column({ type: 'varchar', default: 'home' })
  label!: string;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
