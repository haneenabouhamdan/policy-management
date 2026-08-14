import { MigrationInterface, QueryRunner } from 'typeorm';

export class SearchAndListIndexes1734049200000 implements MigrationInterface {
  name = 'SearchAndListIndexes1734049200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policies_search_text"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_search_text_trgm" ON "policies" USING gin ("search_text" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_updated_at" ON "policies" ("updated_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_type_updated" ON "policies" ("type_id", "updated_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_status_updated" ON "policies" ("status", "updated_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_policies_status_updated"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policies_type_updated"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_policies_updated_at"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_policies_search_text_trgm"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_search_text" ON "policies" ("search_text")`,
    );
  }
}
