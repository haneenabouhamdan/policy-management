import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyStatus } from '../../entities/policy-status.enum';
import { PolicyTypeResponseDto } from '../../policy-types/dto/policy-type-response.dto';

export class PolicyTypeSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Travel' })
  name!: string;
}

export class PolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  typeId!: string;

  @ApiPropertyOptional({ type: PolicyTypeResponseDto })
  type?: PolicyTypeResponseDto | PolicyTypeSummaryDto;

  @ApiProperty({ example: 'UAE Weekend Cover' })
  name!: string;

  @ApiProperty({ enum: PolicyStatus, example: PolicyStatus.DRAFT })
  status!: PolicyStatus;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      regions: ['UAE'],
      maxTripDays: 7,
      medicalCover: 50000,
      maxAge: 65,
    },
  })
  attributes!: Record<string, unknown>;

  @ApiProperty({ example: 1 })
  schemaVersion!: number;

  @ApiProperty({ example: 'uae weekend cover uae 7 50000 65' })
  searchText!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiPropertyOptional({
    nullable: true,
    example: 'MjAyNi0wOC0xNFQxMjowMDowMC4wMDBaOjpjY2NjY2NjYy1jY2NjLWNjY2MtY2NjYy1jY2NjY2NjY2NjY2M',
  })
  nextCursor!: string | null;

  @ApiProperty({ example: true })
  hasMore!: boolean;
}

export class PaginatedPoliciesResponseDto {
  @ApiProperty({ type: [PolicyResponseDto] })
  data!: PolicyResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
