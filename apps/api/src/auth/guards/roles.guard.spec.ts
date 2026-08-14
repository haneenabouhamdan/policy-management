import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../entities/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new RolesGuard(reflector as unknown as Reflector);

  const contextFor = (role?: UserRole) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () =>
          role ? { user: { id: '1', email: 'a@b.c', role } } : {},
      }),
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextFor(UserRole.VIEWER))).toBe(true);
  });

  it('allows matching role', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === ROLES_KEY ? [UserRole.ADMIN] : undefined,
    );
    expect(guard.canActivate(contextFor(UserRole.ADMIN))).toBe(true);
  });

  it('rejects mismatched role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(contextFor(UserRole.VIEWER))).toThrow(
      ForbiddenException,
    );
  });
});
