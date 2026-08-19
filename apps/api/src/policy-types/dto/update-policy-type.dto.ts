import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import { AtLeastOneOfConstraint } from '../../common/validation/at-least-one.constraint';

export class UpdatePolicyTypeDto {
  @ApiHideProperty()
  @Validate(AtLeastOneOfConstraint, ['name', 'description', 'schema'])
  _atLeastOne?: never;

  @ApiPropertyOptional({ example: 'Travel', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Travel insurance product',
    maxLength: 2000,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Replaces the product schema and bumps schemaVersion',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  schema?: Record<string, unknown>;
}
