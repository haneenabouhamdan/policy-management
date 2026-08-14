import { ApiProperty } from '@nestjs/swagger';
import { PolicyStatus } from '../../entities/policy-status.enum';

export class PolicyStatusCountsDto {
  @ApiProperty({ example: 4 })
  DRAFT!: number;

  @ApiProperty({ example: 8 })
  ACTIVE!: number;

  @ApiProperty({ example: 3 })
  INACTIVE!: number;
}

export class PolicyTypeCountDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Travel' })
  name!: string;

  @ApiProperty({ example: 6 })
  count!: number;
}

export class PolicySummaryDto {
  @ApiProperty({ example: 15 })
  total!: number;

  @ApiProperty({ type: PolicyStatusCountsDto })
  byStatus!: PolicyStatusCountsDto;

  @ApiProperty({ type: [PolicyTypeCountDto] })
  byType!: PolicyTypeCountDto[];

  @ApiProperty({
    example: 2,
    description: 'Policies captured against an older product schema',
  })
  staleSchema!: number;
}

export const EMPTY_STATUS_COUNTS: Record<PolicyStatus, number> = {
  [PolicyStatus.DRAFT]: 0,
  [PolicyStatus.ACTIVE]: 0,
  [PolicyStatus.INACTIVE]: 0,
};
