import { INestApplication } from '@nestjs/common';
import {
  CREDENTIALS,
  createTestApp,
  http,
  jsonBody,
  loginAs,
  type LoginBody,
} from './helpers/app';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/tenants lists MGAs', async () => {
    const res = await http(app).get('/auth/tenants').expect(200);
    const slugs = jsonBody<Array<{ slug: string }>>(res).map((row) => row.slug);
    expect(slugs).toEqual(expect.arrayContaining(['atom', 'northwind']));
  });

  it('POST /auth/login succeeds for seeded admin', async () => {
    const res = await http(app)
      .post('/auth/login')
      .send(CREDENTIALS.atomAdmin)
      .expect(200);
    const body = jsonBody<LoginBody>(res);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user.email).toBe(CREDENTIALS.atomAdmin.email);
    expect(body.user.tenantSlug).toBe('atom');
  });

  it('POST /auth/login rejects a bad password', async () => {
    await http(app)
      .post('/auth/login')
      .send({ ...CREDENTIALS.atomAdmin, password: 'WrongPass1!' })
      .expect(401);
  });

  it('POST /auth/login rejects an unknown tenant', async () => {
    await http(app)
      .post('/auth/login')
      .send({ ...CREDENTIALS.atomAdmin, tenantSlug: 'missing-mga' })
      .expect(401);
  });

  it('POST /auth/login rejects missing fields', async () => {
    await http(app)
      .post('/auth/login')
      .send({ tenantSlug: 'atom' })
      .expect(400);
  });

  it('GET /auth/me is 401 without a token', async () => {
    await http(app).get('/auth/me').expect(401);
  });

  it('GET /auth/me returns the current user', async () => {
    const token = await loginAs(app, ...Object.values(CREDENTIALS.atomAdmin));
    const res = await http(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const body = jsonBody<LoginBody['user']>(res);
    expect(body.email).toBe(CREDENTIALS.atomAdmin.email);
    expect(body.role).toBe('ADMIN');
  });
});
