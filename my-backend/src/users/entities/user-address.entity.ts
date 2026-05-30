import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Province } from '../../locations/entities/province.entity';
import { Ward } from '../../locations/entities/ward.entity';

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

  @Column({ name: 'province_id', type: 'integer', nullable: true })
  provinceId?: number;

  @Column({ name: 'ward_id', type: 'integer', nullable: true })
  wardId?: number;

  @Column({ name: 'address_detail', type: 'text', nullable: true })
  addressDetail?: string;

  @ManyToOne(() => Province, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'province_id' })
  provinceObj?: Province;

  @ManyToOne(() => Ward, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ward_id' })
  wardObj?: Ward;

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

