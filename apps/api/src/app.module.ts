import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { RequestContextInterceptor } from './common/request-context.interceptor';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { PoliciesModule } from './policies/policies.module';
import { PolicyTypesModule } from './policy-types/policy-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60_000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
        },
      ],
    }),
    DatabaseModule,
    AuthModule,
    PolicyTypesModule,
    PoliciesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RequestContextMiddleware,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
