import { ApiProperty } from '@nestjs/swagger';
import { PolicyTypeEventType } from '../../entities/policy-type-event-type.enum';

export class PolicyTypeEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  typeId!: string;

  @ApiProperty({ enum: PolicyTypeEventType })
  type!: PolicyTypeEventType;

  @ApiProperty({ example: 'admin@local.dev' })
  actorEmail!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { fromVersion: 1, toVersion: 2, added: ['Notes'] },
  })
  payload!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;
}
