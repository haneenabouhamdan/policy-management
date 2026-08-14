import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Policy } from './policy.entity';
import { Tenant } from './tenant.entity';
import type { PolicyTypeSchema } from '../common/schema/policy-schema';

@Entity({ name: 'policy_types' })
@Index('UQ_policy_types_tenant_name', ['tenantId', 'name'], { unique: true })
export class PolicyType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb' })
  schema!: PolicyTypeSchema;

  @Column({ name: 'schema_version', type: 'int', default: 1 })
  schemaVersion!: number;

  @OneToMany(() => Policy, (policy) => policy.type)
  policies!: Policy[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
