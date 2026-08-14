import { ApiProperty } from '@nestjs/swagger';

export class TenantOptionDto {
  @ApiProperty({ example: 'atom' })
  slug!: string;

  @ApiProperty({ example: 'Atom Coverholder' })
  name!: string;
}
