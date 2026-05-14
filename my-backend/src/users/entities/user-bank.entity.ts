import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_banks')
export class UserBank {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.banks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'bank_name' })
  bankName!: string;

  @Column({ name: 'account_name' })
  accountName!: string;

  @Column({ name: 'account_number' })
  accountNumber!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
