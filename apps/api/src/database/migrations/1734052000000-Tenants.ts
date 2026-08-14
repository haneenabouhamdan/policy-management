import { MigrationInterface, QueryRunner } from 'typeorm';

const ATOM_TENANT_ID = 'a1111111-1111-4111-8111-111111111111';
const NORTHWIND_TENANT_ID = 'a2222222-2222-4222-8222-222222222222';

export class Tenants1734052000000 implements MigrationInterface {
  name = 'Tenants1734052000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "slug" varchar(80) NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `
      INSERT INTO "tenants" ("id", "name", "slug")
      VALUES
        ($1, 'Atom Coverholder', 'atom'),
        ($2, 'Northwind MGA', 'northwind')
      `,
      [ATOM_TENANT_ID, NORTHWIND_TENANT_ID],
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "tenant_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_types" ADD COLUMN "tenant_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "policies" ADD COLUMN "tenant_id" uuid`,
    );

    await queryRunner.query(
      `UPDATE "users" SET "tenant_id" = $1 WHERE "tenant_id" IS NULL`,
      [ATOM_TENANT_ID],
    );
    await queryRunner.query(
      `UPDATE "policy_types" SET "tenant_id" = $1 WHERE "tenant_id" IS NULL`,
      [ATOM_TENANT_ID],
    );
    await queryRunner.query(
      `UPDATE "policies" SET "tenant_id" = $1 WHERE "tenant_id" IS NULL`,
      [ATOM_TENANT_ID],
    );

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "tenant_id" SET NOT NULL,
        ADD CONSTRAINT "FK_users_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "policy_types"
        ALTER COLUMN "tenant_id" SET NOT NULL,
        ADD CONSTRAINT "FK_policy_types_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "policies"
        ALTER COLUMN "tenant_id" SET NOT NULL,
        ADD CONSTRAINT "FK_policies_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_types" DROP CONSTRAINT IF EXISTS "policy_types_name_key"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_tenant_email" ON "users" ("tenant_id", "email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_policy_types_tenant_name" ON "policy_types" ("tenant_id", "name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_tenant" ON "users" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_tenant_status" ON "policies" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_tenant_type_status" ON "policies" ("tenant_id", "type_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_policies_tenant_type_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_policies_tenant_status"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_tenant"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_policy_types_tenant_name"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_tenant_email"`);

    await queryRunner.query(
      `ALTER TABLE "policies" DROP CONSTRAINT IF EXISTS "FK_policies_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_types" DROP CONSTRAINT IF EXISTS "FK_policy_types_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_tenant"`,
    );

    await queryRunner.query(
      `ALTER TABLE "policies" DROP COLUMN IF EXISTS "tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_types" DROP COLUMN IF EXISTS "tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_types" ADD CONSTRAINT "policy_types_name_key" UNIQUE ("name")`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
