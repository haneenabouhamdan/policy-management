import { INestApplication } from '@nestjs/common';
import {
  CREDENTIALS,
  createTestApp,
  http,
  jsonBody,
  loginAs,
  type PolicyTypeBody,
} from './helpers/app';

const MINIMAL_SCHEMA = {
  sections: [
    {
      id: 'details',
      title: 'Details',
      fields: [
        {
          key: 'note',
          label: 'Note',
          type: 'string',
          required: true,
        },
      ],
    },
  ],
};

describe('Policy types (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let underwriterToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    adminToken = await loginAs(app, ...Object.values(CREDENTIALS.atomAdmin));
    underwriterToken = await loginAs(
      app,
      ...Object.values(CREDENTIALS.atomUnderwriter),
    );
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

  it('GET /policy-types lists products', async () => {
    const res = await auth(adminToken).get('/policy-types').expect(200);
    const body = jsonBody<PolicyTypeBody[]>(res);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]?.id).toEqual(expect.any(String));
    expect(body[0]?.name).toEqual(expect.any(String));
    expect(body[0]?.schema).toEqual(expect.any(Object));
  });

  it('UNDERWRITER cannot create a product', async () => {
    await auth(underwriterToken)
      .post('/policy-types')
      .send({
        name: `Blocked ${Date.now()}`,
        schema: MINIMAL_SCHEMA,
      })
      .expect(403);
  });

  it('ADMIN can create, fetch, list events, and bump schema version', async () => {
    const name = `E2E Product ${Date.now()}`;
    const created = jsonBody<PolicyTypeBody>(
      await auth(adminToken)
        .post('/policy-types')
        .send({
          name,
          description: 'HTTP test product',
          schema: MINIMAL_SCHEMA,
        })
        .expect(201),
    );
    expect(created.schemaVersion).toBe(1);

    const id = created.id;
    await auth(adminToken).get(`/policy-types/${id}`).expect(200);

    const events = jsonBody<unknown[]>(
      await auth(adminToken).get(`/policy-types/${id}/events`).expect(200),
    );
    expect(events.length).toBeGreaterThan(0);

    await auth(adminToken).patch(`/policy-types/${id}`).send({}).expect(400);
    await auth(adminToken)
      .patch(`/policy-types/${id}`)
      .send({ name: '   ' })
      .expect(400);

    const updated = jsonBody<PolicyTypeBody>(
      await auth(adminToken)
        .patch(`/policy-types/${id}`)
        .send({
          schema: {
            sections: [
              {
                id: 'details',
                title: 'Details',
                fields: [
                  {
                    key: 'note',
                    label: 'Note',
                    type: 'string',
                    required: true,
                  },
                  {
                    key: 'limit',
                    label: 'Limit',
                    type: 'number',
                    required: false,
                    min: 0,
                  },
                ],
              },
            ],
          },
        })
        .expect(200),
    );
    expect(updated.schemaVersion).toBe(2);
  });

  it('rejects duplicate field keys in a schema', async () => {
    await auth(adminToken)
      .post('/policy-types')
      .send({
        name: `Dup ${Date.now()}`,
        schema: {
          sections: [
            {
              id: 'a',
              title: 'A',
              fields: [
                { key: 'cover', label: 'Cover', type: 'number', min: 0 },
              ],
            },
            {
              id: 'b',
              title: 'B',
              fields: [{ key: 'cover', label: 'Cover 2', type: 'string' }],
            },
          ],
        },
      })
      .expect(400);
  });
});
