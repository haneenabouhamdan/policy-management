import { MigrationInterface, QueryRunner } from 'typeorm';

export class PolicyTypeEvents1734051000000 implements MigrationInterface {
  name = 'PolicyTypeEvents1734051000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "policy_type_event_type" AS ENUM ('CREATED', 'UPDATED', 'SCHEMA_CHANGED')
    `);

    await queryRunner.query(`
      CREATE TABLE "policy_type_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type_id" uuid NOT NULL REFERENCES "policy_types"("id") ON DELETE CASCADE,
        "type" "policy_type_event_type" NOT NULL,
        "actor_id" uuid NULL,
        "actor_email" varchar(180) NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_policy_type_events_type_created" ON "policy_type_events" ("type_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_policy_type_events_type_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_type_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "policy_type_event_type"`);
  }
}
