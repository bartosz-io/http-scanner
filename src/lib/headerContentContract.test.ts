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

function getOpeningFrontmatter(source: string): string | undefined {
  return source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
}

function parseFrontmatterList(frontmatter: string, field: string): string[] {
  const lines = frontmatter.split(/\r?\n/);
  const fieldIndex = lines.findIndex((line) => line === `${field}:`);
  if (fieldIndex === -1) {
    return [];
  }

  const values: string[] = [];
  for (const line of lines.slice(fieldIndex + 1)) {
    if (/^[A-Za-z][A-Za-z0-9]*:/.test(line)) {
      break;
    }

    const listItem = line.match(/^\s+-\s+([^#]+?)(?:\s+#.*)?$/);
    if (listItem) {
      values.push(listItem[1].trim());
    }
  }

  return values;
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

  it('keeps Access-Control-Allow-Origin aligned with CORS troubleshooting intent', () => {
    const source = readFileSync(
      new URL(
        'src/content/headers/access-control-allow-origin.md',
        PROJECT_ROOT
      ),
      'utf8'
    );

    for (const phrase of [
      '## Access-Control-Allow-Origin values',
      '## Common CORS origin errors',
      '## Credentials, dynamic origins, and caching',
      'Access-Control-Allow-Origin: *',
      'Access-Control-Allow-Credentials: true',
      'Vary: Origin',
      'serialized `null` origin',
      'comma-separated list',
      'request can reach the server even when browser script cannot read the response',
      'exact allowlist',
    ]) {
      expect(source).toContain(phrase);
    }
  });

  it('keeps Access-Control-Max-Age aligned with preflight-cache intent', () => {
    const source = readFileSync(
      new URL(
        'src/content/headers/access-control-max-age.md',
        PROJECT_ROOT
      ),
      'utf8'
    );

    for (const phrase of [
      '## How the CORS preflight cache works',
      '## Choosing an Access-Control-Max-Age value',
      '## Access-Control-Max-Age vs Cache-Control',
      'OPTIONS /api/items HTTP/1.1',
      'Access-Control-Max-Age: 600',
      'default is five seconds',
      'browser-imposed cap',
      'separate from the general HTTP cache',
      'delay browser adoption of a tightened preflight policy',
      'authorization on every actual request',
      'Cache-Control: max-age',
    ]) {
      expect(source).toContain(phrase);
    }
  });

  it('keeps Access-Control-Allow-Credentials aligned with credentialed CORS troubleshooting intent', () => {
    const source = readFileSync(
      new URL(
        'src/content/headers/access-control-allow-credentials.md',
        PROJECT_ROOT
      ),
      'utf8'
    );

    for (const phrase of [
      '## Credentialed CORS request and response',
      '## Common Access-Control-Allow-Credentials errors',
      '## Cookies, SameSite, CSRF, and authorization',
      "credentials: 'include'",
      'Access-Control-Allow-Origin: https://app.example',
      'Access-Control-Allow-Credentials: true',
      'Vary: Origin',
      'SameSite=None',
      'case-sensitive token `true`',
      'omit the field rather than sending `false`',
      '`Access-Control-Allow-Origin: *`',
      'preflight itself does not include credentials',
      'simple credentialed request can be sent without a preflight',
      'third-party cookie',
      'CSRF protection',
      'object-level authorization',
    ]) {
      expect(source).toContain(phrase);
    }
  });

  it('keeps Access-Control-Allow-Methods aligned with CORS method troubleshooting intent', () => {
    const source = readFileSync(
      new URL(
        'src/content/headers/access-control-allow-methods.md',
        PROJECT_ROOT
      ),
      'utf8'
    );
    const frontmatter = getOpeningFrontmatter(source);
    const expectedRelatedHeaders = [
      'access-control-allow-origin',
      'access-control-allow-headers',
      'access-control-allow-credentials',
      'access-control-max-age',
    ];

    expect(frontmatter).toBeDefined();
    expect(frontmatter?.match(/^relatedHeaders:/gm)).toHaveLength(1);
    expect(parseFrontmatterList(frontmatter ?? '', 'relatedHeaders')).toEqual(
      expectedRelatedHeaders
    );

    const bypassSource = source.replace(
      '  - access-control-max-age\nreferences:',
      '  - access-control-max-age\n\n  # This comment must not hide another item.\n  - set-cookie\nreferences:'
    );
    const bypassFrontmatter = getOpeningFrontmatter(bypassSource);

    expect(
      parseFrontmatterList(bypassFrontmatter ?? '', 'relatedHeaders')
    ).toEqual([...expectedRelatedHeaders, 'set-cookie']);

    for (const phrase of [
      '## CORS preflight method exchange',
      '## Common Access-Control-Allow-Methods errors',
      '## Wildcard, credentials, and safelisted methods',
      '## Access-Control-Allow-Methods vs Allow and authorization',
      "method: 'PUT'",
      'OPTIONS /items/42 HTTP/1.1',
      'Access-Control-Request-Method: PUT',
      'Access-Control-Request-Headers: content-type',
      'Access-Control-Allow-Origin: https://app.example',
      'Access-Control-Allow-Methods: GET, PUT',
      'Access-Control-Allow-Headers: Content-Type',
      'Vary: Origin',
      'preflight transport method',
      '`GET`, `HEAD`, and `POST` are CORS-safelisted methods',
      'non-safelisted request headers or a non-safelisted `Content-Type`',
      'credentials mode is `include`',
      'literal method name `*`',
      'Method matching follows the Fetch rules',
      '`Allow` describes methods supported by an HTTP resource',
      '`405 Method Not Allowed`',
      'object-level authorization',
      'CSRF protection',
      '`Access-Control-Max-Age`',
      'A proposed non-safelisted method must be authorized by `Access-Control-Allow-Methods`: list it explicitly unless wildcard semantics apply.',
      'For a request without credentials, `*` can authorize the proposed method; when credentials mode is `include`, `*` is only the literal method name and the proposed method must be listed explicitly.',
      'If neither an explicit method entry nor wildcard semantics authorize the proposed non-safelisted method, the preflight fails.',
      'A CORS-safelisted proposed method does not need to be listed, even when the request preflights because another CORS dimension is not safelisted.',
      'After a successful preflight, the browser can send the actual `PUT`. That route must still authenticate the caller, authorize the target object, validate the body, and enforce any CSRF protection appropriate to its credential model.',
      'A failed preflight prevents a conforming browser from sending this non-simple actual request, but it does not constrain non-browser clients.',
      'If a changed policy appears stale, inspect `Access-Control-Max-Age` because the browser may reuse an earlier preflight grant.',
      'A CORS grant also does not prove that the route exists or that the caller may perform the operation.',
      'Apply authentication, object-level authorization, input validation, rate limits, and CSRF protection to the actual method just as you would for a same-origin or non-browser client.',
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
