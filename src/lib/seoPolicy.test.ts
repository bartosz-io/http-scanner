import { describe, expect, it } from 'vitest';
import { SITE_ORIGIN, shouldIncludeInSitemap } from './seoPolicy';

describe('SEO policy', () => {
  it('uses the production origin for canonical URLs and sitemap entries', () => {
    expect(SITE_ORIGIN).toBe('https://httpscanner.com');
  });

  it.each([
    'https://httpscanner.com/report',
    'https://httpscanner.com/report/',
    'https://httpscanner.com/report/3b7313344566898763fdd1f2a54e228b',
    'https://httpscanner.com/reports',
    'https://httpscanner.com/reports/',
    'https://httpscanner.com/share/3b7313344566898763fdd1f2a54e228b',
  ])('excludes non-indexable URL %s', (page) => {
    expect(shouldIncludeInSitemap(page)).toBe(false);
  });

  it.each([
    'https://httpscanner.com/',
    'https://httpscanner.com/http-headers-checker/',
    'https://httpscanner.com/security-headers-checker/',
    'https://httpscanner.com/headers/',
    'https://httpscanner.com/headers/content-security-policy/',
    'https://httpscanner.com/headers/cache-control/',
    'https://httpscanner.com/headers/set-cookie/',
  ])('includes indexable URL %s', (page) => {
    expect(shouldIncludeInSitemap(page)).toBe(true);
  });
});
