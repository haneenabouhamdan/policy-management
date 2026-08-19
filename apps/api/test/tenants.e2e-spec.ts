import { INestApplication } from '@nestjs/common';
import {
  CREDENTIALS,
  createTestApp,
  http,
  jsonBody,
  loginAs,
  type PolicyListBody,
  type PolicyTypeBody,
} from './helpers/app';

describe('Tenant isolation (e2e)', () => {
  let app: INestApplication;
  let atomToken: string;
  let northwindToken: string;
  let northwindPolicyId: string;
  let northwindTypeId: string;

  beforeAll(async () => {
    app = await createTestApp();
    atomToken = await loginAs(app, ...Object.values(CREDENTIALS.atomAdmin));
    northwindToken = await loginAs(
      app,
      ...Object.values(CREDENTIALS.northwindAdmin),
    );

    const policies = await http(app)
      .get('/policies')
      .set('Authorization', `Bearer ${northwindToken}`)
      .expect(200);
    northwindPolicyId = jsonBody<PolicyListBody>(policies).data[0]?.id ?? '';
    if (!northwindPolicyId) {
      throw new Error('Northwind seed policies are required');
    }

    const types = await http(app)
      .get('/policy-types')
      .set('Authorization', `Bearer ${northwindToken}`)
      .expect(200);
    northwindTypeId = jsonBody<PolicyTypeBody[]>(types)[0]?.id ?? '';
    if (!northwindTypeId) {
      throw new Error('Northwind seed products are required');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('Atom cannot read a Northwind policy (404, not 403)', async () => {
    await http(app)
      .get(`/policies/${northwindPolicyId}`)
      .set('Authorization', `Bearer ${atomToken}`)
      .expect(404);
  });

  it('Atom cannot patch a Northwind policy', async () => {
    await http(app)
      .patch(`/policies/${northwindPolicyId}`)
      .set('Authorization', `Bearer ${atomToken}`)
      .send({ name: 'Should not leak' })
      .expect(404);
  });

  it('Atom cannot read a Northwind product', async () => {
    await http(app)
      .get(`/policy-types/${northwindTypeId}`)
      .set('Authorization', `Bearer ${atomToken}`)
      .expect(404);
  });
});
