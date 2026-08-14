import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PolicyStatus } from '../../entities/policy-status.enum';

export class ListPoliciesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search text',
    maxLength: 100,
    example: 'travel',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  typeId?: string;

  @ApiPropertyOptional({ enum: PolicyStatus })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiPropertyOptional({
    description: 'Attribute key to filter when typeId is set',
    example: 'regions',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z][a-zA-Z0-9_]*$/, {
    message: 'attrKey must be a field key',
  })
  attrKey?: string;

  @ApiPropertyOptional({
    description: 'Attribute value to match (string or array membership)',
    example: 'UAE',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  attrValue?: string;

  @ApiPropertyOptional({
    description: 'Only policies whose schemaVersion is behind the product',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  staleSchema?: boolean;
}
