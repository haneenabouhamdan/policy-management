import { INestApplication } from '@nestjs/common';
import {
  CREDENTIALS,
  TRAVEL_ATTRIBUTES,
  createTestApp,
  http,
  jsonBody,
  loginAs,
  type PolicyBody,
  type PolicyListBody,
  type PolicySummaryBody,
  type PolicyTypeBody,
} from './helpers/app';

describe('Policies (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let viewerToken: string;
  let travelId: string;
  let createdId: string;

  beforeAll(async () => {
    app = await createTestApp();
    adminToken = await loginAs(app, ...Object.values(CREDENTIALS.atomAdmin));
    viewerToken = await loginAs(app, ...Object.values(CREDENTIALS.atomViewer));

    const types = await http(app)
      .get('/policy-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const travel = jsonBody<PolicyTypeBody[]>(types).find(
      (type) => type.name === 'Travel',
    );
    if (!travel) {
      throw new Error('Seeded Travel product is required for policy e2e tests');
    }
    travelId = travel.id;
  });

  afterAll(async () => {
    await app.close();
  });

  function auth(token: string) {
    return {
      get: (url: string) =>
        http(app).get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string) =>
        http(app).post(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) =>
        http(app).patch(url).set('Authorization', `Bearer ${token}`),
    };
  }

  it('GET /policies is 401 without a token', async () => {
    await http(app).get('/policies').expect(401);
  });

  it('GET /policies lists the book', async () => {
    const res = await auth(adminToken).get('/policies').expect(200);
    const body = jsonBody<PolicyListBody>(res);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.hasMore).toEqual(expect.any(Boolean));
    expect(body.meta.limit).toEqual(expect.any(Number));
  });

  it('GET /policies/summary returns counts', async () => {
    const res = await auth(adminToken).get('/policies/summary').expect(200);
    const body = jsonBody<PolicySummaryBody>(res);
    expect(body.total).toBeGreaterThan(0);
    expect(body.byStatus.DRAFT).toEqual(expect.any(Number));
    expect(body.byStatus.ACTIVE).toEqual(expect.any(Number));
    expect(body.byStatus.INACTIVE).toEqual(expect.any(Number));
  });

  it('VIEWER can read but cannot create', async () => {
    await auth(viewerToken).get('/policies').expect(200);
    await auth(viewerToken)
      .post('/policies')
      .send({
        typeId: travelId,
        name: `Viewer blocked ${Date.now()}`,
        attributes: TRAVEL_ATTRIBUTES,
      })
      .expect(403);
  });

  it('rejects a bad UUID', async () => {
    await auth(adminToken).get('/policies/not-a-uuid').expect(400);
  });

  it('creates, reads, lists events, patches, duplicates, and transitions status', async () => {
    const name = `E2E HTTP Cover ${Date.now()}`;
    const created = jsonBody<PolicyBody>(
      await auth(adminToken)
        .post('/policies')
        .send({
          typeId: travelId,
          name,
          attributes: TRAVEL_ATTRIBUTES,
        })
        .expect(201),
    );

    createdId = created.id;
    expect(created.status).toBe('DRAFT');

    const detail = jsonBody<PolicyBody>(
      await auth(adminToken).get(`/policies/${createdId}`).expect(200),
    );
    expect(detail.name).toBe(name);

    const events = jsonBody<unknown[]>(
      await auth(adminToken).get(`/policies/${createdId}/events`).expect(200),
    );
    expect(events.length).toBeGreaterThan(0);

    await auth(adminToken)
      .patch(`/policies/${createdId}`)
      .send({ name: `${name} updated` })
      .expect(200);

    await auth(adminToken).patch(`/policies/${createdId}`).send({}).expect(400);

    const copy = jsonBody<PolicyBody>(
      await auth(adminToken)
        .post(`/policies/${createdId}/duplicate`)
        .expect(201),
    );
    expect(copy.status).toBe('DRAFT');
    expect(copy.name).toContain('(copy)');

    await auth(adminToken)
      .patch(`/policies/${createdId}/status`)
      .send({ status: 'ACTIVE' })
      .expect(200);

    await auth(adminToken)
      .patch(`/policies/${createdId}/status`)
      .send({ status: 'DRAFT' })
      .expect(400);

    await auth(adminToken)
      .patch(`/policies/${createdId}/status`)
      .send({ status: 'INACTIVE' })
      .expect(200);

    await auth(adminToken)
      .patch(`/policies/${createdId}/status`)
      .send({ status: 'ACTIVE' })
      .expect(400);

    await auth(adminToken)
      .patch(`/policies/${createdId}/status`)
      .send({ status: 'ACTIVE', reason: 'short' })
      .expect(400);

    const reactivated = jsonBody<PolicyBody>(
      await auth(adminToken)
        .patch(`/policies/${createdId}/status`)
        .send({
          status: 'ACTIVE',
          reason: 'Cover reinstated after review',
        })
        .expect(200),
    );
    expect(reactivated.status).toBe('ACTIVE');
  });
});
