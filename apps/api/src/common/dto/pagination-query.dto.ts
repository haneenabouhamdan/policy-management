import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Keyset cursor from the previous page `meta.nextCursor` (updatedAt + id)',
    example: 'MjAyNi0wOC0xNFQxMjowMDowMC4wMDBaOjpjY2NjY2NjYy1jY2NjLWNjY2MtY2NjYy1jY2NjY2NjY2NjY2M',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  after?: string;

  @ApiPropertyOptional({
    type: 'integer',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
