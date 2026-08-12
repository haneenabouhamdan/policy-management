import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Policy } from './policy.entity';
import type { PolicyTypeSchema } from '../common/schema/policy-schema';

@Entity({ name: 'policy_types' })
export class PolicyType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
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
