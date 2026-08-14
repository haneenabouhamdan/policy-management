import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const usersRepo = { findOne: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function createStrategy() {
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();
    return module.get(JwtStrategy);
  }

  it('returns the active user from the token subject', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'maya.hassan@atomcover.com',
      role: UserRole.ADMIN,
      isActive: true,
      tenantId: 'tenant-1',
      tenant: { id: 'tenant-1', name: 'Atom Coverholder', slug: 'atom' },
    });
    const strategy = await createStrategy();
    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'maya.hassan@atomcover.com',
        tenantId: 'tenant-1',
      }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'maya.hassan@atomcover.com',
      role: UserRole.ADMIN,
      tenantId: 'tenant-1',
      tenantName: 'Atom Coverholder',
      tenantSlug: 'atom',
    });
  });

  it('rejects inactive users', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'maya.hassan@atomcover.com',
      role: UserRole.ADMIN,
      isActive: false,
    });
    const strategy = await createStrategy();
    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'maya.hassan@atomcover.com',
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
