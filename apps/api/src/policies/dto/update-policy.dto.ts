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

export class UpdatePolicyDto {
  @ApiHideProperty()
  @Validate(AtLeastOneOfConstraint, ['name', 'attributes'])
  _atLeastOne?: never;

  @ApiPropertyOptional({ example: 'Updated policy name', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Values keyed by field.key from the policy type schema',
    type: 'object',
    additionalProperties: true,
    example: {
      regions: ['UAE', 'GCC'],
      maxTripDays: 14,
      medicalCover: 75000,
      maxAge: 70,
    },
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
