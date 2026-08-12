import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1734048000000 implements MigrationInterface {
  name = 'InitSchema1734048000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "policy_status" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE')
    `);

    await queryRunner.query(`
      CREATE TABLE "policy_types" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL UNIQUE,
        "description" text NULL,
        "schema" jsonb NOT NULL,
        "schema_version" int NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "policies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type_id" uuid NOT NULL REFERENCES "policy_types"("id") ON DELETE RESTRICT,
        "name" varchar(200) NOT NULL,
        "status" "policy_status" NOT NULL DEFAULT 'DRAFT',
        "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "schema_version" int NOT NULL,
        "search_text" varchar(2000) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_policies_status" ON "policies" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_type_status" ON "policies" ("type_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_search_text" ON "policies" ("search_text")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policies_search_text"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policies_type_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policies_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_types"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "policy_status"`);
  }
}
