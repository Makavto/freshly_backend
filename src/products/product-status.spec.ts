import {
  addUtcDays,
  getProductStatus,
  localCalendarDateUtc,
  ProductStatus,
} from './product-status';

describe('getProductStatus', () => {
  const today = new Date(2026, 8, 14, 12, 0, 0);
  const days = 3;

  it('returns expired when expiry is before today', () => {
    expect(getProductStatus(new Date(Date.UTC(2026, 8, 13)), today, days)).toBe(
      ProductStatus.EXPIRED,
    );
  });

  it('returns expiring_soon on today', () => {
    expect(getProductStatus(new Date(Date.UTC(2026, 8, 14)), today, days)).toBe(
      ProductStatus.EXPIRING_SOON,
    );
  });

  it('returns expiring_soon on the last threshold day', () => {
    expect(getProductStatus(new Date(Date.UTC(2026, 8, 17)), today, days)).toBe(
      ProductStatus.EXPIRING_SOON,
    );
  });

  it('returns fresh after the threshold', () => {
    expect(getProductStatus(new Date(Date.UTC(2026, 8, 18)), today, days)).toBe(
      ProductStatus.FRESH,
    );
  });
});

describe('localCalendarDateUtc', () => {
  it('uses local calendar date as UTC midnight', () => {
    const result = localCalendarDateUtc(new Date(2026, 8, 14, 23, 30));
    expect(result.toISOString()).toBe('2026-09-14T00:00:00.000Z');
  });
});

describe('addUtcDays', () => {
  it('adds days in UTC', () => {
    const start = new Date(Date.UTC(2026, 8, 14));
    expect(addUtcDays(start, 3).toISOString()).toBe('2026-09-17T00:00:00.000Z');
  });
});
