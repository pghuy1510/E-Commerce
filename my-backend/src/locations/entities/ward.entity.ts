import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Province } from './province.entity';

@Entity('wards')
@Index('idx_ward_code', ['code'], { unique: true })
@Index('idx_ward_name', ['name'])
@Index('idx_ward_province_id', ['provinceId'])
export class Ward {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'province_id', type: 'integer' })
  provinceId!: number;

  @ManyToOne(() => Province, (province) => province.wards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'province_id' })
  province!: Province;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
