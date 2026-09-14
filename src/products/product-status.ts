export enum ProductStatus {
  FRESH = 'fresh',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
}

export function utcDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function localCalendarDateUtc(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function getProductStatus(
  expiresAt: Date,
  today: Date,
  expiringSoonDays: number,
): ProductStatus {
  const expiry = utcDateOnly(expiresAt);
  const current = localCalendarDateUtc(today);
  if (expiry < current) {
    return ProductStatus.EXPIRED;
  }
  const soonLimit = addUtcDays(current, expiringSoonDays);
  if (expiry <= soonLimit) {
    return ProductStatus.EXPIRING_SOON;
  }
  return ProductStatus.FRESH;
}

export function statusToExpiresAtFilter(
  status: ProductStatus,
  today: Date,
  expiringSoonDays: number,
): { lt?: Date; gte?: Date; lte?: Date; gt?: Date } {
  const current = localCalendarDateUtc(today);
  const soonLimit = addUtcDays(current, expiringSoonDays);
  if (status === ProductStatus.EXPIRED) {
    return { lt: current };
  }
  if (status === ProductStatus.EXPIRING_SOON) {
    return { gte: current, lte: soonLimit };
  }
  return { gt: soonLimit };
}
