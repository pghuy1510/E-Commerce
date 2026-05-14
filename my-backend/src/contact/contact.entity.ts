import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column('text')
  message!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
