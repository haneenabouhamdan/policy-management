import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
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
    findOne: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
  };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('token') };
  const config = { get: jest.fn().mockReturnValue('8h') };
  let service: AuthService;

  const user = {
    id: 'user-1',
    email: 'admin@local.dev',
    fullName: 'Admin User',
    role: UserRole.ADMIN,
    passwordHash: 'hash',
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('returns a token for valid credentials', async () => {
    usersRepo.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'Admin@local.dev',
      password: 'Admin123!',
    });

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'admin@local.dev' },
    });
    expect(result.accessToken).toBe('token');
    expect(result.user.role).toBe(UserRole.ADMIN);
  });

  it('rejects a wrong password', async () => {
    usersRepo.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'admin@local.dev', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('still hashes against a dummy value when the user is missing', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'missing@local.dev', password: 'Admin123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  it('rejects an inactive user after comparing the password', async () => {
    usersRepo.findOne.mockResolvedValue({ ...user, isActive: false });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login({ email: 'admin@local.dev', password: 'Admin123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the active profile', async () => {
    usersRepo.findOne.mockResolvedValue(user);
    await expect(service.getProfile('user-1')).resolves.toEqual({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  });

  it('rejects a missing profile', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
