import { UserRole } from '../../entities/user-role.enum';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};
