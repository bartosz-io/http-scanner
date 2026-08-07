import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateHeaderGuideSource } from './headerContentContract';
import { listHeaderCatalogEntries } from './headerCatalog';

const PROJECT_ROOT = new URL('../../', import.meta.url);
const LONG_BODY = Array.from({ length: 180 }, (_, index) => `word${index + 1}`).join(' ');

const securityAndPrivacySlugs = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
  'clear-site-data',
  'origin-agent-cluster',
  'x-permitted-cross-domain-policies',
  'x-dns-prefetch-control',
] as const;

const infrastructureAndCachingSlugs = [
  'server',
  'x-powered-by',
  'x-aspnet-version',
  'x-runtime',
  'x-generator',
  'via',
  'cache-control',
  'age',
  'expires',
  'etag',
  'last-modified',
  'vary',
] as const;

const representationSlugs = [
  'content-type',
  'content-length',
  'content-encoding',
  'content-language',
  'content-disposition',
  'content-location',
  'accept-ranges',
] as const;

const corsSlugs = [
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-expose-headers',
  'access-control-max-age',
] as const;

const controlAndMetadataSlugs = [
  'set-cookie',
  'www-authenticate',
  'location',
  'retry-after',
  'link',
  'server-timing',
  'timing-allow-origin',
] as const;

function createGuideSource({
  body = LONG_BODY,
  headerName = 'cache-control',
  relatedHeaders = ['etag'],
}: {
  body?: string;
  headerName?: string;
  relatedHeaders?: string[];
} = {}): string {
  return `---
headerName: ${headerName}
description: A deliberately complete description used to exercise the Markdown source contract without relying on Astro parsing.
applicability: response
syntax: Cache-Control: max-age=3600
examples:
  - Cache-Control: no-store
useCases:
  - Prevent caching
  - Control freshness
commonMistakes:
  - Applying contradictory directives
  - Forgetting shared caches
securityConsiderations: Caching sensitive responses can disclose private information to another user.
relatedHeaders:
${relatedHeaders.map((relatedHeader) => `  - ${relatedHeader}`).join('\n')}
references:
  - label: RFC 9111
    url: https://www.rfc-editor.org/rfc/rfc9111
---
## Meaning and behavior

${body}

## Implementation notes

Configure the header at the response boundary.
`;
}

describe('HTTP header guide source contract', () => {
  it('keeps Content-Type guide aligned with high-intent search topics', () => {
    const source = readFileSync(
      new URL('src/content/headers/content-type.md', PROJECT_ROOT),
      'utf8'
    );

    for (const phrase of [
      'MIME type',
      'text/html',
      'charset=utf-8',
      'X-Content-Type-Options: nosniff',
      'HTTP Headers Checker',
    ]) {
      expect(source).toContain(phrase);
    }
  });

  it('keeps Set-Cookie guide aligned with high-intent security topics', () => {
    const source = readFileSync(
      new URL('src/content/headers/set-cookie.md', PROJECT_ROOT),
      'utf8'
    );

    for (const phrase of [
      'Secure',
      'HttpOnly',
      'SameSite',
      'Max-Age',
      'Expires',
      '__Host-',
      'CORS',
      'credentials mode',
      'CORS primarily controls whether browser JavaScript may read the response',
      'a cookie can still be sent when CORS rejects response exposure',
    ]) {
      expect(source).toContain(phrase);
    }
  });

  it('accepts a complete guide source', () => {
    expect(validateHeaderGuideSource('cache-control', createGuideSource())).toEqual([]);
  });

  it('rejects a guide missing a required heading', () => {
    const source = createGuideSource().replace('## Meaning and behavior\n', '');

    expect(validateHeaderGuideSource('cache-control', source)).toContain(
      'Missing required heading: ## Meaning and behavior'
    );
  });

  it('rejects a frontmatter headerName that differs from the filename slug', () => {
    expect(validateHeaderGuideSource('cache-control', createGuideSource({ headerName: 'etag' }))).toContain(
      'Header slug "cache-control" does not match frontmatter headerName "etag"'
    );
  });

  it('rejects a guide body with fewer than 180 words', () => {
    const source = createGuideSource({
      body: Array.from({ length: 160 }, () => 'word').join(' '),
    });

    expect(validateHeaderGuideSource('cache-control', source)).toContain(
      'Guide body must contain at least 180 words'
    );
  });

  it('rejects client directives', () => {
    const source = createGuideSource().replace(
      'Configure the header at the response boundary.',
      '<HeaderWidget client:load />'
    );

    expect(validateHeaderGuideSource('cache-control', source)).toContain(
      'Guide source must not contain client: directives'
    );
  });

  it('rejects JSON-LD scripts', () => {
    const source = createGuideSource().replace(
      'Configure the header at the response boundary.',
      '<script type="application/ld+json">{}</script>'
    );

    expect(validateHeaderGuideSource('cache-control', source)).toContain(
      'Guide source must not contain application/ld+json'
    );
  });

  it('rejects related-header slugs that are absent from the catalog', () => {
    const source = createGuideSource({ relatedHeaders: ['etag', 'not-a-real-header'] });

    expect(validateHeaderGuideSource('cache-control', source)).toContain(
      'Unknown related header: not-a-real-header'
    );
  });

  it('accumulates validation errors in stable contract order', () => {
    const source = createGuideSource({
      body: 'client:load application/ld+json',
      headerName: 'etag',
      relatedHeaders: ['not-a-real-header'],
    })
      .replace('## Meaning and behavior\n', '')
      .replace('## Implementation notes\n', '');

    expect(validateHeaderGuideSource('cache-control', source)).toEqual([
      'Header slug "cache-control" does not match frontmatter headerName "etag"',
      'Missing required heading: ## Meaning and behavior',
      'Missing required heading: ## Implementation notes',
      'Guide body must contain at least 180 words',
      'Guide source must not contain client: directives',
      'Guide source must not contain application/ld+json',
      'Unknown related header: not-a-real-header',
    ]);
  });

  it('validates every security and privacy guide', () => {
    const errors = securityAndPrivacySlugs.flatMap((slug) => {
      const guideUrl = new URL(`src/content/headers/${slug}.md`, PROJECT_ROOT);
      if (!existsSync(guideUrl)) {
        return [`Missing guide: ${slug}`];
      }

      return validateHeaderGuideSource(slug, readFileSync(guideUrl, 'utf8'))
        .map((error) => `${slug}: ${error}`);
    });

    expect(errors).toEqual([]);
  });

  it('validates every infrastructure, disclosure, and caching guide', () => {
    const errors = infrastructureAndCachingSlugs.flatMap((slug) => {
      const guideUrl = new URL(`src/content/headers/${slug}.md`, PROJECT_ROOT);
      if (!existsSync(guideUrl)) {
        return [`Missing guide: ${slug}`];
      }

      return validateHeaderGuideSource(slug, readFileSync(guideUrl, 'utf8'))
        .map((error) => `${slug}: ${error}`);
    });

    expect(errors).toEqual([]);
  });

  it('validates every content and representation guide', () => {
    const errors = representationSlugs.flatMap((slug) => {
      const guideUrl = new URL(`src/content/headers/${slug}.md`, PROJECT_ROOT);
      if (!existsSync(guideUrl)) {
        return [`Missing guide: ${slug}`];
      }

      return validateHeaderGuideSource(slug, readFileSync(guideUrl, 'utf8'))
        .map((error) => `${slug}: ${error}`);
    });

    expect(errors).toEqual([]);
  });

  it('validates every CORS guide', () => {
    const errors = corsSlugs.flatMap((slug) => {
      const guideUrl = new URL(`src/content/headers/${slug}.md`, PROJECT_ROOT);
      if (!existsSync(guideUrl)) {
        return [`Missing guide: ${slug}`];
      }

      return validateHeaderGuideSource(slug, readFileSync(guideUrl, 'utf8'))
        .map((error) => `${slug}: ${error}`);
    });

    expect(errors).toEqual([]);
  });

  it('validates every cookie, control, linking, and timing guide', () => {
    const errors = controlAndMetadataSlugs.flatMap((slug) => {
      const guideUrl = new URL(`src/content/headers/${slug}.md`, PROJECT_ROOT);
      if (!existsSync(guideUrl)) {
        return [`Missing guide: ${slug}`];
      }

      return validateHeaderGuideSource(slug, readFileSync(guideUrl, 'utf8'))
        .map((error) => `${slug}: ${error}`);
    });

    expect(errors).toEqual([]);
  });

  it('matches the complete catalog one-to-one with unique descriptions', () => {
    const contentDirectoryUrl = new URL('src/content/headers/', PROJECT_ROOT);
    const files = readdirSync(contentDirectoryUrl)
      .filter((file) => file.endsWith('.md'))
      .sort((left, right) => (
        left.replace(/\.md$/, '').localeCompare(right.replace(/\.md$/, ''))
      ));
    const sources = files.map((file) => readFileSync(new URL(file, contentDirectoryUrl), 'utf8'));
    const catalogEntries = listHeaderCatalogEntries();
    const catalogSlugs = catalogEntries.map((entry) => entry.slug).sort();
    const catalogNames = catalogEntries.map((entry) => entry.name).sort();
    const sourceNames = sources.map((source) => (
      source.match(/^headerName:\s*(.+)$/m)?.[1]?.trim() ?? ''
    )).sort();
    const descriptions = sources.map((source) => (
      source.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? ''
    ));

    expect(files.map((file) => file.replace(/\.md$/, ''))).toEqual(catalogSlugs);
    expect(sourceNames).toEqual(catalogNames);
    expect(descriptions).toHaveLength(45);
    expect(new Set(descriptions).size).toBe(45);
    expect(descriptions).not.toContain('');
  });
});
