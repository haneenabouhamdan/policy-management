import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const base = {
    DB_HOST: 'localhost',
    DB_PORT: 5433,
    DB_USER: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_NAME: 'policies',
    JWT_SECRET: 'a-sufficiently-long-secret',
  };

  it('accepts a complete config', () => {
    expect(validateEnv(base).JWT_SECRET).toBe('a-sufficiently-long-secret');
  });

  it('rejects a short JWT secret', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow();
  });
});
