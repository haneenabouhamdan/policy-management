import { ApiProperty } from '@nestjs/swagger';
import { PolicyEventType } from '../../entities/policy-event-type.enum';

export class PolicyEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  policyId!: string;

  @ApiProperty({ enum: PolicyEventType })
  type!: PolicyEventType;

  @ApiProperty({ example: 'maya.hassan@atomcover.com' })
  actorEmail!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { status: { from: 'DRAFT', to: 'ACTIVE' } },
  })
  payload!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;
}
