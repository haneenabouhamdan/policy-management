import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

export type LoginBody = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: {
    email: string;
    tenantSlug: string;
    role: string;
  };
};

export type PolicyBody = {
  id: string;
  name: string;
  status: string;
};

export type PolicyListBody = {
  data: PolicyBody[];
  meta: { hasMore: boolean; limit: number; nextCursor: string | null };
};

export type PolicySummaryBody = {
  total: number;
  byStatus: { DRAFT: number; ACTIVE: number; INACTIVE: number };
};

export type PolicyTypeBody = {
  id: string;
  name: string;
  schema: Record<string, unknown>;
  schemaVersion: number;
};

export function http(app: INestApplication) {
  return request(app.getHttpServer() as App);
}

export function jsonBody<T>(res: Response): T {
  return res.body as T;
}

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return app;
}

export async function loginAs(
  app: INestApplication,
  tenantSlug: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await http(app)
    .post('/auth/login')
    .send({ tenantSlug, email, password })
    .expect(200);

  return jsonBody<LoginBody>(res).accessToken;
}

export const CREDENTIALS = {
  atomAdmin: {
    tenantSlug: 'atom',
    email: 'maya.hassan@atomcover.com',
    password: 'Admin123!',
  },
  atomUnderwriter: {
    tenantSlug: 'atom',
    email: 'omar.khalil@atomcover.com',
    password: 'Underwriter123!',
  },
  atomViewer: {
    tenantSlug: 'atom',
    email: 'lina.farhat@atomcover.com',
    password: 'Viewer123!',
  },
  northwindAdmin: {
    tenantSlug: 'northwind',
    email: 'james.okonkwo@northwindmga.com',
    password: 'Admin123!',
  },
} as const;

export const TRAVEL_ATTRIBUTES = {
  regions: ['UAE'],
  maxTripDays: 7,
  medicalCover: 50000,
  maxAge: 40,
};
