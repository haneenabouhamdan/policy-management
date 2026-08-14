import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from '../entities/policy.entity';
import { PolicyEvent } from '../entities/policy-event.entity';
import { PolicyType } from '../entities/policy-type.entity';
import { PolicyTypeEvent } from '../entities/policy-type-event.entity';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { TenantQueryRunnerPatchService } from './tenant-query-runner.patch';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: [Tenant, PolicyType, Policy, PolicyEvent, PolicyTypeEvent, User],
        synchronize: false,
        migrationsRun: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
  providers: [TenantQueryRunnerPatchService],
})
export class DatabaseModule {}
