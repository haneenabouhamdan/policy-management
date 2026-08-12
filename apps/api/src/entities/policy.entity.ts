import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PolicyType } from './policy-type.entity';
import { PolicyStatus } from './policy-status.enum';

@Entity({ name: 'policies' })
@Index('IDX_policies_status', ['status'])
@Index('IDX_policies_type_status', ['typeId', 'status'])
@Index('IDX_policies_search_text', ['searchText'])
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'type_id', type: 'uuid' })
  typeId!: string;

  @ManyToOne(() => PolicyType, (type) => type.policies, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'type_id' })
  type!: PolicyType;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({
    type: 'enum',
    enum: PolicyStatus,
    enumName: 'policy_status',
    default: PolicyStatus.DRAFT,
  })
  status!: PolicyStatus;

  @Column({ type: 'jsonb', default: {} })
  attributes!: Record<string, unknown>;

  @Column({ name: 'schema_version', type: 'int' })
  schemaVersion!: number;

  @Column({ name: 'search_text', type: 'varchar', length: 2000 })
  searchText!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
