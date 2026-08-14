import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user-role.enum';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'maya.hassan@atomcover.com' })
  email!: string;

  @ApiProperty({ example: 'Maya Hassan' })
  fullName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role!: UserRole;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'Atom Coverholder' })
  tenantName!: string;

  @ApiProperty({ example: 'atom' })
  tenantSlug!: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: '8h' })
  expiresIn!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
