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

  @Column({ name: 'image_proof', type: 'text', nullable: true })
  imageProof?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
