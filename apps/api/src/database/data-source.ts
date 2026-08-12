import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { Policy } from '../entities/policy.entity';
import { PolicyType } from '../entities/policy-type.entity';

loadEnv({ path: '../../.env' });
loadEnv();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'policies',
  entities: [PolicyType, Policy],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
