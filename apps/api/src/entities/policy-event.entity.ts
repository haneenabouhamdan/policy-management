import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Policy } from './policy.entity';
import { PolicyEventType } from './policy-event-type.enum';

@Entity({ name: 'policy_events' })
@Index('IDX_policy_events_policy_created', ['policyId', 'createdAt'])
export class PolicyEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'policy_id', type: 'uuid' })
  policyId!: string;

  @ManyToOne(() => Policy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy!: Policy;

  @Column({
    type: 'enum',
    enum: PolicyEventType,
    enumName: 'policy_event_type',
  })
  type!: PolicyEventType;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 180 })
  actorEmail!: string;

  @Column({ type: 'jsonb', default: {} })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
