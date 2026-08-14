import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  typeId!: string;

  @ApiProperty({ example: 'UAE Weekend Cover', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Values keyed by field.key from the policy type schema',
    type: 'object',
    additionalProperties: true,
    example: {
      regions: ['UAE'],
      maxTripDays: 7,
      medicalCover: 50000,
      maxAge: 65,
    },
  })
  @IsObject()
  attributes!: Record<string, unknown>;
}
