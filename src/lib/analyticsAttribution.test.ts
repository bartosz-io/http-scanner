import { describe, expect, it } from 'vitest';
import {
  createAnalyticsAttribution,
  getAnalyticsAttribution,
  sanitizeAttributionUrl,
  type AnalyticsStorage,
} from './analyticsAttribution';

const LANDING_URL = new URL(
  'https://httpscanner.com/security-headers-checker?utm_source=google#scanner'
);

function createStorage(initialValue?: string): AnalyticsStorage {
  let storedValue = initialValue ?? null;

  return {
    getItem: () => storedValue,
    setItem: (_key, value) => {
      storedValue = value;
    },
  };
}

describe('sanitizeAttributionUrl', () => {
  it('keeps only the origin and pathname', () => {
    expect(sanitizeAttributionUrl(LANDING_URL.href)).toBe(
      'https://httpscanner.com/security-headers-checker'
    );
  });

  it('returns null for an empty or invalid URL', () => {
    expect(sanitizeAttributionUrl('')).toBeNull();
    expect(sanitizeAttributionUrl('not a URL')).toBeNull();
  });
});

describe('createAnalyticsAttribution', () => {
  it('creates query-free landing and referrer properties', () => {
    expect(
      createAnalyticsAttribution(
        LANDING_URL,
        'https://www.google.com/search?q=security+headers#results'
      )
    ).toEqual({
      landing_page: 'https://httpscanner.com/security-headers-checker',
      landing_path: '/security-headers-checker',
      referrer: 'https://www.google.com/search',
    });
  });

  it('uses null when the referrer is unavailable', () => {
    expect(createAnalyticsAttribution(LANDING_URL, '').referrer).toBeNull();
  });
});

describe('getAnalyticsAttribution', () => {
  it('reuses the first landing attribution on a later report document', () => {
    const storage = createStorage();
    const first = getAnalyticsAttribution({
      location: LANDING_URL,
      referrer: 'https://www.google.com/search?q=headers',
      storage,
    });
    const report = getAnalyticsAttribution({
      location: new URL(
        'https://httpscanner.com/report/9249232fefb9a1c0455ba007d7784f6c'
      ),
      referrer: 'https://httpscanner.com/',
      storage,
    });

    expect(report).toEqual(first);
    expect(report?.landing_path).toBe('/security-headers-checker');
  });

  it('still returns safe attribution when storage access fails', () => {
    const throwingStorage: AnalyticsStorage = {
      getItem: () => {
        throw new Error('storage denied');
      },
      setItem: () => {
        throw new Error('storage denied');
      },
    };

    expect(
      getAnalyticsAttribution({
        location: LANDING_URL,
        referrer: '',
        storage: throwingStorage,
      })
    ).toEqual({
      landing_page: 'https://httpscanner.com/security-headers-checker',
      landing_path: '/security-headers-checker',
      referrer: null,
    });
  });
});
