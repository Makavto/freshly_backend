const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
  'MINIO_PUBLIC_URL',
] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of REQUIRED_ENV) {
    const value = config[key];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const expiringSoonDays = Number(config.EXPIRING_SOON_DAYS ?? 3);
  if (!Number.isInteger(expiringSoonDays) || expiringSoonDays < 1) {
    throw new Error('EXPIRING_SOON_DAYS must be an integer greater than 0');
  }

  return {
    ...config,
    PORT: Number(config.PORT ?? 3000),
    EXPIRING_SOON_DAYS: expiringSoonDays,
    MINIO_PORT: Number(config.MINIO_PORT ?? 9000),
    MINIO_USE_SSL:
      config.MINIO_USE_SSL === true || config.MINIO_USE_SSL === 'true',
    JWT_ACCESS_EXPIRES_IN: config.JWT_ACCESS_EXPIRES_IN ?? '15m',
    JWT_REFRESH_EXPIRES_IN: config.JWT_REFRESH_EXPIRES_IN ?? '7d',
    CORS_ORIGIN: config.CORS_ORIGIN ?? '*',
  };
}
