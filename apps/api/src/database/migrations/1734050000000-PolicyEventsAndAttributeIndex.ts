import { MigrationInterface, QueryRunner } from 'typeorm';

export class PolicyEventsAndAttributeIndex1734050000000 implements MigrationInterface {
  name = 'PolicyEventsAndAttributeIndex1734050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "policy_event_type" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED')
    `);

    await queryRunner.query(`
      CREATE TABLE "policy_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "policy_id" uuid NOT NULL REFERENCES "policies"("id") ON DELETE CASCADE,
        "type" "policy_event_type" NOT NULL,
        "actor_id" uuid NULL,
        "actor_email" varchar(180) NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_policy_events_policy_created" ON "policy_events" ("policy_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_attributes" ON "policies" USING gin ("attributes")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policies_attributes"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_policy_events_policy_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "policy_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "policy_event_type"`);
  }
}
