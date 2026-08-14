import { DataSource, QueryRunner } from 'typeorm';
import { getRequestContext } from '../common/request-context';

const PATCHED = Symbol('tenantQueryRunnerPatched');

type PgClient = {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
};

export function installTenantQueryRunnerPatch(dataSource: DataSource) {
  const tagged = dataSource as DataSource & { [PATCHED]?: boolean };
  if (tagged[PATCHED]) {
    return;
  }
  tagged[PATCHED] = true;

  const original = dataSource.createQueryRunner.bind(dataSource);
  dataSource.createQueryRunner = function (
    ...args: Parameters<DataSource['createQueryRunner']>
  ) {
    const runner = original(...args);
    patchQueryRunner(runner);
    return runner;
  };
}

function patchQueryRunner(runner: QueryRunner) {
  const originalConnect = runner.connect.bind(runner);
  const originalRelease = runner.release.bind(runner);

  runner.connect = async () => {
    const connection = (await originalConnect()) as PgClient;
    const tenantId = getRequestContext()?.tenantId;
    if (tenantId) {
      await connection.query(`SELECT set_config('app.tenant_id', $1, false)`, [
        tenantId,
      ]);
    }
    return connection;
  };

  runner.release = async () => {
    try {
      if (!runner.isReleased) {
        const connection = (await originalConnect()) as PgClient | undefined;
        await connection?.query(`SELECT set_config('app.tenant_id', '', false)`);
      }
    } catch {
      // Connection may already be gone.
    }
    return originalRelease();
  };
}
