import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user-role.enum';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin@local.dev' })
  email!: string;

  @ApiProperty({ example: 'Admin User' })
  fullName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role!: UserRole;
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
