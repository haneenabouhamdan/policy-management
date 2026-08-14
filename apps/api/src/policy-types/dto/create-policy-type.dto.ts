import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePolicyTypeDto {
  @ApiProperty({ example: 'Travel', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Travel insurance product',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Product field schema (sections + fields)',
    type: 'object',
    additionalProperties: true,
    example: {
      sections: [
        {
          id: 'trip',
          title: 'Trip details',
          fields: [
            {
              key: 'regions',
              label: 'Regions',
              type: 'multiselect',
              required: true,
              options: ['UAE', 'GCC', 'EU'],
            },
            {
              key: 'maxTripDays',
              label: 'Max trip days',
              type: 'number',
              required: true,
              min: 1,
              max: 365,
            },
          ],
        },
      ],
    },
  })
  @IsObject()
  schema!: Record<string, unknown>;
}
