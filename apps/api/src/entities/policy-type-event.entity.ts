import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PolicyType } from './policy-type.entity';
import { PolicyTypeEventType } from './policy-type-event-type.enum';

@Entity({ name: 'policy_type_events' })
@Index('IDX_policy_type_events_type_created', ['typeId', 'createdAt'])
export class PolicyTypeEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'type_id', type: 'uuid' })
  typeId!: string;

  @ManyToOne(() => PolicyType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'type_id' })
  policyType!: PolicyType;

  @Column({
    type: 'enum',
    enum: PolicyTypeEventType,
    enumName: 'policy_type_event_type',
  })
  type!: PolicyTypeEventType;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 180 })
  actorEmail!: string;

  @Column({ type: 'jsonb', default: {} })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
