import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('promotion_logs')
export class PromotionLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'admin_id', type: 'int', nullable: true })
  adminId?: number | null;

  @Column({ name: 'performed_by', type: 'varchar', nullable: true })
  performedBy?: string | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType!: 'coupon' | 'deal';

  @Column({ name: 'entity_id', type: 'int' })
  entityId!: number;

  @Column({ type: 'varchar' })
  action!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue?: Record<string, any> | null;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue?: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
