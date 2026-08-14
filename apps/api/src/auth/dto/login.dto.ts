import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'atom', description: 'Tenant slug (MGA)' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'tenantSlug must be a lowercase slug',
  })
  tenantSlug!: string;

  @ApiProperty({ example: 'maya.hassan@atomcover.com' })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'Admin123!', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
