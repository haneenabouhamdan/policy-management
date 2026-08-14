import { MigrationInterface, QueryRunner } from 'typeorm';

const APP_ROLE = 'policy_app';
const APP_PASSWORD = 'postgres';

export class RowLevelSecurity1734053000000 implements MigrationInterface {
  name = 'RowLevelSecurity1734053000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
          CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}';
        ELSE
          ALTER ROLE ${APP_ROLE} WITH LOGIN PASSWORD '${APP_PASSWORD}';
        END IF;
      END
      $$
    `);

    const dbRows = (await queryRunner.query(
      `SELECT current_database() AS name`,
    )) as Array<{ name: string }>;
    const database = dbRows[0]?.name;
    if (database) {
      await queryRunner.query(
        `GRANT CONNECT ON DATABASE "${database}" TO ${APP_ROLE}`,
      );
    }

    await queryRunner.query(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE}`);
    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_ROLE}`,
    );
    await queryRunner.query(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_ROLE}`,
    );
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_ROLE}`,
    );
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_ROLE}`,
    );

    await this.enableTenantRls(queryRunner, 'users');
    await this.enableTenantRls(queryRunner, 'policy_types');
    await this.enableTenantRls(queryRunner, 'policies');

    await queryRunner.query(
      `ALTER TABLE "policy_events" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_events" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY tenant_isolation ON "policy_events"
      USING (
        EXISTS (
          SELECT 1 FROM "policies" p
          WHERE p.id = "policy_events"."policy_id"
            AND p.tenant_id::text = current_setting('app.tenant_id', true)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "policies" p
          WHERE p.id = "policy_events"."policy_id"
            AND p.tenant_id::text = current_setting('app.tenant_id', true)
        )
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "policy_type_events" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_type_events" FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY tenant_isolation ON "policy_type_events"
      USING (
        EXISTS (
          SELECT 1 FROM "policy_types" t
          WHERE t.id = "policy_type_events"."type_id"
            AND t.tenant_id::text = current_setting('app.tenant_id', true)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "policy_types" t
          WHERE t.id = "policy_type_events"."type_id"
            AND t.tenant_id::text = current_setting('app.tenant_id', true)
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS tenant_isolation ON "policy_type_events"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_type_events" NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_type_events" DISABLE ROW LEVEL SECURITY`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS tenant_isolation ON "policy_events"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_events" NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_events" DISABLE ROW LEVEL SECURITY`,
    );

    for (const table of ['policies', 'policy_types', 'users']) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation ON "${table}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`,
      );
    }
  }

  private async enableTenantRls(
    queryRunner: QueryRunner,
    table: string,
  ): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation ON "${table}"
      USING (tenant_id::text = current_setting('app.tenant_id', true))
      WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))
    `);
  }
}
