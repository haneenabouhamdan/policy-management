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
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const count = await this.usersRepo.count();
    if (count > 0) return;

    const defaults = [
      {
        email: 'admin@local.dev',
        fullName: 'Admin User',
        role: UserRole.ADMIN,
        password: 'Admin123!',
      },
      {
        email: 'underwriter@local.dev',
        fullName: 'Underwriter User',
        role: UserRole.UNDERWRITER,
        password: 'Underwriter123!',
      },
      {
        email: 'viewer@local.dev',
        fullName: 'Viewer User',
        role: UserRole.VIEWER,
        password: 'Viewer123!',
      },
    ];

    for (const item of defaults) {
      const passwordHash = await bcrypt.hash(item.password, 12);
      await this.usersRepo.save(
        this.usersRepo.create({
          email: item.email,
          fullName: item.fullName,
          role: item.role,
          passwordHash,
          isActive: true,
        }),
      );
    }

    this.logger.log('Seeded default users (admin / underwriter / viewer)');
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '8h',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
