import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePolicyTypeDto {
  @ApiPropertyOptional({ example: 'Travel', maxLength: 120 })
  @IsOptional()
  @IsString()
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
