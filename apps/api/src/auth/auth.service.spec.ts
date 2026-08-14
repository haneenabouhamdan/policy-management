import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const usersRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
  };
  const tenantsRepo = {
    findOne: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('token') };
  const config = { get: jest.fn().mockReturnValue('8h') };
  let service: AuthService;

  const user = {
    id: 'user-1',
    email: 'maya.hassan@atomcover.com',
    fullName: 'Maya Hassan',
    role: UserRole.ADMIN,
    passwordHash: 'hash',
    isActive: true,
    tenantId: 'tenant-1',
    tenant: { id: 'tenant-1', name: 'Atom Coverholder' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Tenant), useValue: tenantsRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('returns a token for valid credentials', async () => {
    usersRepo.find.mockResolvedValue([user]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'maya.hassan@atomcover.com',
      password: 'Admin123!',
    });

    expect(usersRepo.find).toHaveBeenCalledWith({
      where: { email: 'maya.hassan@atomcover.com' },
      relations: { tenant: true },
    });
    expect(result.accessToken).toBe('token');
    expect(result.user.role).toBe(UserRole.ADMIN);
    expect(result.user.tenantName).toBe('Atom Coverholder');
  });

  it('rejects a wrong password', async () => {
    usersRepo.find.mockResolvedValue([user]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'maya.hassan@atomcover.com', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('still hashes against a dummy value when the user is missing', async () => {
    usersRepo.find.mockResolvedValue([]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'missing@example.com', password: 'Admin123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it('rejects an inactive user after comparing the password', async () => {
    usersRepo.find.mockResolvedValue([{ ...user, isActive: false }]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login({ email: 'maya.hassan@atomcover.com', password: 'Admin123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the active profile', async () => {
    usersRepo.findOne.mockResolvedValue(user);
    await expect(service.getProfile('user-1')).resolves.toEqual({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
    });
  });

  it('rejects a missing profile', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
