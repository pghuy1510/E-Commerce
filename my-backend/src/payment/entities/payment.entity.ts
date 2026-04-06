import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  order_id!: number;

  @Column()
  method!: string; // COD | MOMO | VNPAY

  @Column('decimal')
  amount!: number;

  @Column({ default: 'pending' })
  status!: string; // pending | success | failed

  @Column({ nullable: true })
  transaction_id!: string;

  @CreateDateColumn()
  created_at!: Date;
}
