import { describe, expect, it } from 'vitest';
import {
  HEADER_CATEGORIES,
  getHeaderCatalogEntry,
  listHeaderCatalogEntries,
} from './headerCatalog';

const expectedNames = [
  'content-security-policy', 'strict-transport-security',
  'x-content-type-options', 'x-frame-options', 'referrer-policy',
  'permissions-policy', 'cross-origin-opener-policy',
  'cross-origin-embedder-policy', 'cross-origin-resource-policy',
  'clear-site-data', 'origin-agent-cluster',
  'x-permitted-cross-domain-policies', 'x-dns-prefetch-control',
  'server', 'x-powered-by', 'x-aspnet-version', 'x-runtime',
  'x-generator', 'via', 'cache-control', 'age', 'expires', 'etag',
  'last-modified', 'vary', 'content-type', 'content-length',
  'content-encoding', 'content-language', 'content-disposition',
  'content-location', 'accept-ranges', 'access-control-allow-origin',
  'access-control-allow-credentials', 'access-control-allow-methods',
  'access-control-allow-headers', 'access-control-expose-headers',
  'access-control-max-age', 'set-cookie', 'www-authenticate', 'location',
  'retry-after', 'link', 'server-timing', 'timing-allow-origin',
].sort();

describe('header catalog', () => {
  it('contains the exact approved inventory with unique names and slugs', () => {
    const entries = listHeaderCatalogEntries();
    expect(entries.map(({ name }) => name).sort()).toEqual(expectedNames);
    expect(new Set(entries.map(({ name }) => name)).size).toBe(entries.length);
    expect(new Set(entries.map(({ slug }) => slug)).size).toBe(entries.length);
  });

  it('uses only approved categories and complete neutral metadata', () => {
    for (const entry of listHeaderCatalogEntries()) {
      expect(HEADER_CATEGORIES).toContain(entry.category);
      expect(entry.slug).toBe(entry.name);
      expect(entry.displayName.length).toBeGreaterThan(1);
      expect(entry.summary.length).toBeGreaterThan(40);
      expect(entry.summary).not.toMatch(/pass|fail|missing|score|penalty/i);
    }
  });

  it('looks up canonical names case-insensitively', () => {
    expect(getHeaderCatalogEntry('Cache-Control')?.slug).toBe('cache-control');
    expect(getHeaderCatalogEntry('X-Custom-Thing')).toBeUndefined();
  });
});
