import { INestApplication } from '@nestjs/common';
import { createTestApp, http, jsonBody } from './helpers/app';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / returns the API name', async () => {
    await http(app).get('/').expect(200).expect('Policy Management API');
  });

  it('GET /health is public', async () => {
    const res = await http(app).get('/health').expect(200);
    expect(jsonBody<{ status: string }>(res)).toEqual({ status: 'ok' });
  });
});
