import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static SEO assets', () => {
  it('publishes crawler rules and the sitemap location', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Disallow: /report/');
    expect(robots).toContain('Disallow: /reports');
    expect(robots).toContain('Disallow: /share/');
    expect(robots).toContain(
      'Sitemap: https://httpscanner.com/sitemap-index.xml'
    );
  });

  it('caches only fingerprinted Astro assets immutably', () => {
    const headers = readFileSync('public/_headers', 'utf8');

    expect(headers).toBe(
      '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n'
    );
  });
});
