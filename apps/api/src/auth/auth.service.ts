import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';
import { runWithTenant } from '../common/request-context';
import { LoginDto } from './dto/login.dto';

type SeedUser = {
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
  aliases?: string[];
};

const ATOM_USERS: SeedUser[] = [
  {
    email: 'maya.hassan@atomcover.com',
    fullName: 'Maya Hassan',
    role: UserRole.ADMIN,
    password: 'Admin123!',
    aliases: ['admin@local.dev'],
  },
  {
    email: 'omar.khalil@atomcover.com',
    fullName: 'Omar Khalil',
    role: UserRole.UNDERWRITER,
    password: 'Underwriter123!',
    aliases: ['underwriter@local.dev'],
  },
  {
    email: 'lina.farhat@atomcover.com',
    fullName: 'Lina Farhat',
    role: UserRole.VIEWER,
    password: 'Viewer123!',
    aliases: ['viewer@local.dev'],
  },
  {
    email: 'alex.rivera@example.com',
    fullName: 'Alex Rivera',
    role: UserRole.UNDERWRITER,
    password: 'Underwriter123!',
  },
];

const NORTHWIND_USERS: SeedUser[] = [
  {
    email: 'james.okonkwo@northwindmga.com',
    fullName: 'James Okonkwo',
    role: UserRole.ADMIN,
    password: 'Admin123!',
    aliases: ['admin@northwind.local'],
  },
  {
    email: 'priya.shah@northwindmga.com',
    fullName: 'Priya Shah',
    role: UserRole.UNDERWRITER,
    password: 'Underwriter123!',
    aliases: ['underwriter@northwind.local'],
  },
  {
    email: 'alex.rivera@example.com',
    fullName: 'Alex Rivera',
    role: UserRole.UNDERWRITER,
    password: 'Underwriter123!',
  },
];

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private dummyPasswordHash?: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedUsersForSlug('atom', ATOM_USERS);
    await this.seedUsersForSlug('northwind', NORTHWIND_USERS);
  }

  async listTenants() {
    return this.tenantsRepo.find({
      select: { slug: true, name: true },
      order: { name: 'ASC' },
    });
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const slug = dto.tenantSlug.trim().toLowerCase();
    const tenant = await this.tenantsRepo.findOne({ where: { slug } });
    const user = tenant
      ? await runWithTenant(tenant.id, () =>
          this.usersRepo.findOne({
            where: { email, tenantId: tenant.id },
            relations: { tenant: true },
          }),
        )
      : null;
    const passwordHash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !user.isActive || !valid || !user.tenant) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '8h',
      user: this.toProfile(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { tenant: true },
    });
    if (!user || !user.isActive || !user.tenant) {
      throw new UnauthorizedException();
    }

    return this.toProfile(user);
  }

  private toProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
    };
  }

  private async seedUsersForSlug(slug: string, defaults: SeedUser[]) {
    const tenant = await this.tenantsRepo.findOne({ where: { slug } });
    if (!tenant) return;

    await runWithTenant(tenant.id, () => this.seedUsers(tenant, defaults));
  }

  private async seedUsers(tenant: Tenant, defaults: SeedUser[]) {
    let created = 0;
    let renamed = 0;

    for (const item of defaults) {
      const byEmail = await this.usersRepo.findOne({
        where: { tenantId: tenant.id, email: item.email },
      });
      if (byEmail) {
        if (byEmail.fullName !== item.fullName) {
          byEmail.fullName = item.fullName;
          await this.usersRepo.save(byEmail);
        }
        continue;
      }

      let existing: User | null = null;
      for (const alias of item.aliases ?? []) {
        existing = await this.usersRepo.findOne({
          where: { tenantId: tenant.id, email: alias },
        });
        if (existing) break;
      }

      if (existing) {
        existing.email = item.email;
        existing.fullName = item.fullName;
        await this.usersRepo.save(existing);
        renamed += 1;
        continue;
      }

      const passwordHash = await bcrypt.hash(item.password, 12);
      await this.usersRepo.save(
        this.usersRepo.create({
          tenantId: tenant.id,
          email: item.email,
          fullName: item.fullName,
          role: item.role,
          passwordHash,
          isActive: true,
        }),
      );
      created += 1;
    }

    if (created > 0 || renamed > 0) {
      this.logger.log(
        `Demo users for ${tenant.slug}: created ${created}, renamed ${renamed}`,
      );
    }
  }

  private async getDummyHash() {
    if (!this.dummyPasswordHash) {
      this.dummyPasswordHash = await bcrypt.hash('invalid-password', 12);
    }
    return this.dummyPasswordHash;
  }
}
