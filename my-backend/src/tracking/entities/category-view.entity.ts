import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('category_views')
@Index('idx_category_views_user', ['user_id'])
@Index('idx_category_views_category', ['category_id'])
export class CategoryView {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column({ name: 'category_id' })
  category_id!: number;

  @Column({ default: 1 })
  weight!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;
}
