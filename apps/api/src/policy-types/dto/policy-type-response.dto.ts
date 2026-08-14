import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PolicyTypeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Travel' })
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Travel insurance product' })
  description!: string | null;

  @ApiProperty({
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
              options: ['UAE', 'GCC'],
            },
          ],
        },
      ],
    },
  })
  schema!: Record<string, unknown>;

  @ApiProperty({ example: 1 })
  schemaVersion!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
