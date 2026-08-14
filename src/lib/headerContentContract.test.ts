import { existsSync, readFileSync, readdirSync } from 'node:fs';
// @ts-expect-error jsdom has no bundled type declarations.
import { JSDOM } from 'jsdom';
import { markdownToMdast, type MdastNode } from 'satteri';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
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

type MarkdownContractNode = {
  endOffset: number;
  startOffset: number;
  text: string;
};

type MarkdownParagraphContractNode = MarkdownContractNode & {
  inlineCodeValues: string[];
};

type MarkdownCodeBlockContractNode = MarkdownContractNode & {
  lang: string | null;
  value: string;
};

type MarkdownTableContractNode = MarkdownContractNode & {
  columnCount: number;
  rowCount: number;
};

function getMarkdownNodeText(node: MdastNode): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }

  if ('alt' in node && typeof node.alt === 'string') {
    return node.alt;
  }

  if ('children' in node) {
    return node.children.map((child) => getMarkdownNodeText(child)).join('');
  }

  return '';
}

function collectMarkdownContractNodes(source: string): {
  codeBlocks: MarkdownCodeBlockContractNode[];
  h2Headings: MarkdownContractNode[];
  htmlBlocks: string[];
  httpCodeBlocks: string[];
  linkDestinations: string[];
  paragraphs: MarkdownParagraphContractNode[];
  tables: MarkdownTableContractNode[];
} {
  const codeBlocks: MarkdownCodeBlockContractNode[] = [];
  const h2Headings: MarkdownContractNode[] = [];
  const htmlBlocks: string[] = [];
  const httpCodeBlocks: string[] = [];
  const linkDestinations: string[] = [];
  const paragraphs: MarkdownParagraphContractNode[] = [];
  const tables: MarkdownTableContractNode[] = [];
  const tree = markdownToMdast(source);

  const visit = (node: MdastNode) => {
    const startOffset = node.position?.start.offset;
    const endOffset = node.position?.end.offset;

    if (typeof startOffset === 'number' && typeof endOffset === 'number') {
      const contractNode = {
        endOffset,
        startOffset,
        text: getMarkdownNodeText(node).trim(),
      };

      if (node.type === 'heading' && node.depth === 2) {
        h2Headings.push(contractNode);
      } else if (
        node.type === 'code' &&
        'value' in node &&
        typeof node.value === 'string'
      ) {
        const lang = 'lang' in node && typeof node.lang === 'string'
          ? node.lang
          : null;

        codeBlocks.push({
          ...contractNode,
          lang,
          value: node.value,
        });

        if (lang === 'http') {
          httpCodeBlocks.push(node.value);
        }
      } else if (
        node.type === 'html' &&
        'value' in node &&
        typeof node.value === 'string'
      ) {
        htmlBlocks.push(node.value);
      } else if (node.type === 'table' && 'children' in node) {
        const rows = node.children.filter((child) => child.type === 'tableRow');
        const firstRow = rows[0];
        const columnCount = firstRow && 'children' in firstRow
          ? firstRow.children.filter((child) => child.type === 'tableCell').length
          : 0;

        tables.push({
          ...contractNode,
          columnCount,
          rowCount: rows.length,
        });
      } else if (
        node.type === 'link' &&
        'url' in node &&
        typeof node.url === 'string'
      ) {
        linkDestinations.push(node.url);
      } else if (node.type === 'paragraph' && 'children' in node) {
        paragraphs.push({
          ...contractNode,
          inlineCodeValues: node.children
            .filter((child) => child.type === 'inlineCode')
            .map((child) => getMarkdownNodeText(child)),
        });
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        visit(child);
      }
    }
  };
  visit(tree);

  return {
    codeBlocks,
    h2Headings,
    htmlBlocks,
    httpCodeBlocks,
    linkDestinations,
    paragraphs,
    tables,
  };
}

function expectParseableScript(source: string, scriptKind: ts.ScriptKind): void {
  const file = ts.createSourceFile(
    'guide-example.ts',
    source,
    ts.ScriptTarget.ESNext,
    true,
    scriptKind
  ) as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] };

  expect(file.parseDiagnostics).toEqual([]);
}

function extractH2HeadingsAfter(
  source: string,
  boundaryHeading: string
): string[] {
  const { h2Headings } = collectMarkdownContractNodes(source);
  const boundaryText = boundaryHeading.replace(/^##\s+/, '');
  const boundary = h2Headings.find(({ text }) => text === boundaryText);
  if (!boundary) {
    return [];
  }

  return h2Headings
    .filter(({ startOffset }) => startOffset >= boundary.endOffset)
    .map(({ text }) => `## ${text}`);
}

function extractInlineCodeParagraphsBetween(
  source: string,
  startHeading: string,
  endHeading: string
): Array<{ inlineCodeValues: string[]; text: string }> {
  const { h2Headings, paragraphs } = collectMarkdownContractNodes(source);
  const startText = startHeading.replace(/^##\s+/, '');
  const endText = endHeading.replace(/^##\s+/, '');
  const start = h2Headings.find(({ text }) => text === startText);
  const end = h2Headings.find(
    ({ startOffset, text }) =>
      text === endText && startOffset > (start?.endOffset ?? -1)
  );
  if (!start || !end) {
    return [];
  }

  return paragraphs
    .filter(
      ({ endOffset, inlineCodeValues, startOffset }) =>
        startOffset >= start.endOffset &&
        endOffset <= end.startOffset &&
        inlineCodeValues.length > 1
    )
    .map(({ inlineCodeValues, text }) => ({ inlineCodeValues, text }));
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

  it('keeps Access-Control-Allow-Headers aligned with CORS request-header troubleshooting intent', () => {
    const source = readFileSync(
      new URL(
        'src/content/headers/access-control-allow-headers.md',
        PROJECT_ROOT
      ),
      'utf8'
    );
    const frontmatter = getOpeningFrontmatter(source);
    const expectedRelatedHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-credentials',
      'access-control-expose-headers',
      'access-control-max-age',
    ];
    const headings = [
      '## CORS preflight request-header exchange',
      '## Fix “Request header field … is not allowed”',
      '## Wildcard, Authorization, and safelisted value restrictions',
      '## Allowed names vs trusted values and response exposure',
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

    const headingOffsets = headings.map((heading) => source.indexOf(heading));
    expect(headingOffsets.every((offset) => offset >= 0)).toBe(true);
    expect(headingOffsets).toEqual([...headingOffsets].sort((a, b) => a - b));

    const javascriptBlocks = [...source.matchAll(/```js\r?\n([\s\S]*?)\r?\n```/g)];
    const httpBlocks = [...source.matchAll(/```http\r?\n([\s\S]*?)\r?\n```/g)];

    expect(javascriptBlocks).toHaveLength(1);
    expect(httpBlocks).toHaveLength(1);

    const javascriptBlock = javascriptBlocks[0]?.[1] ?? '';
    const httpBlock = httpBlocks[0]?.[1] ?? '';
    const actualRequest = javascriptBlock.match(
      /fetch\('https:\/\/api\.example(?<path>\/[^']+)', \{\r?\n\s+method: '(?<method>[A-Z]+)'/
    );
    const preflightRequest = httpBlock.match(
      /^OPTIONS (?<path>\/\S+) HTTP\/1\.1[\s\S]*?^Access-Control-Request-Method: (?<method>[A-Z]+)$/m
    );

    expect(actualRequest?.groups?.path).toBe('/items');
    expect(actualRequest?.groups?.method).toBe('POST');
    expect(javascriptBlock).toContain("Authorization: 'Bearer token'");
    expect(javascriptBlock).toContain("'Content-Type': 'application/json'");
    expect(javascriptBlock).toContain(
      "body: JSON.stringify({ name: 'new item' })"
    );

    expect(preflightRequest?.groups?.path).toBe('/items');
    expect(preflightRequest?.groups?.method).toBe('POST');
    expect(httpBlock).toContain(
      'Access-Control-Request-Headers: authorization, content-type'
    );
    expect(actualRequest?.groups?.path).toBe(preflightRequest?.groups?.path);
    expect(actualRequest?.groups?.method).toBe(
      preflightRequest?.groups?.method
    );

    for (const phrase of [
      'Access-Control-Allow-Origin: https://app.example',
      'Access-Control-Allow-Methods: POST',
      'Access-Control-Allow-Headers: Authorization, Content-Type',
      'Vary: Origin',
      'browser—not application JavaScript—creates `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers`',
      'announces request-field names, not the future field values',
      'compare every name in `Access-Control-Request-Headers` with the names authorized by `Access-Control-Allow-Headers`',
      'Setting the right CORS fields only on the later actual response does not repair the preflight',
      'client mistakenly sends response fields such as `Access-Control-Allow-Origin` or `Access-Control-Allow-Headers` as request headers',
      'Header-name matching is ASCII case-insensitive',
      'bounded case-insensitive allowlist',
      '`Access-Control-Max-Age` because the browser may reuse an earlier preflight result',
      '`Access-Control-Allow-Headers: *` has wildcard semantics for requests without credentials',
      'credentials mode is `include`, `*` is only the literal field name `*`',
      '`Authorization` is a non-wildcard request-header name and must always be listed explicitly',
      'does not by itself set Fetch credentials mode to `include`',
      '`Content-Type` is safelisted only when its media type is `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`',
      '`Content-Type: application/json` therefore participates in this preflight',
      'Listing a safelisted field name can authorize it beyond the additional safelist restrictions',
      'does not validate a bearer token, media type, API key, tenant identifier, signature, tracing value, or custom metadata',
      'forwarding, internal identity, or routing fields',
      '`Access-Control-Expose-Headers` controls access to non-safelisted response fields',
      'A failed preflight prevents a conforming browser from sending this non-simple actual request, but it does not block direct HTTP clients.',
      'Authentication, authorization, validation, rate limiting, and CSRF defenses remain server responsibilities.',
    ]) {
      expect(source).toContain(phrase);
    }
  });

  it('keeps Access-Control-Expose-Headers aligned with secure response-metadata exposure intent', () => {
    const source = readFileSync(
      new URL(
        'src/content/headers/access-control-expose-headers.md',
        PROJECT_ROOT
      ),
      'utf8'
    );
    const frontmatter = getOpeningFrontmatter(source);
    const expectedRelatedHeaders = [
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'access-control-allow-headers',
      'content-disposition',
      'set-cookie',
    ];
    const headings = [
      '## Expose only the response metadata your frontend needs',
      '## Cross-origin download with Content-Disposition and ETag',
      '## Fix “visible in Network, but response.headers.get() returns null”',
      '## CORS-safelisted response headers',
      '## Wildcard and credentialed requests',
      '## Why Set-Cookie cannot be exposed',
      '## Exposure is not authorization or data sanitization',
    ];
    const expectedSafelistedResponseHeaders = [
      'Cache-Control',
      'Content-Language',
      'Content-Length',
      'Content-Type',
      'Expires',
      'Last-Modified',
      'Pragma',
    ];

    expect(frontmatter).toBeDefined();
    expect(frontmatter?.match(/^relatedHeaders:/gm)).toHaveLength(1);
    expect(parseFrontmatterList(frontmatter ?? '', 'relatedHeaders')).toEqual(
      expectedRelatedHeaders
    );

    const bypassSource = source.replace(
      '  - set-cookie\nreferences:',
      '  - set-cookie\n\n  # This comment must not hide another item.\n  - etag\nreferences:'
    );
    const bypassFrontmatter = getOpeningFrontmatter(bypassSource);

    expect(
      parseFrontmatterList(bypassFrontmatter ?? '', 'relatedHeaders')
    ).toEqual([...expectedRelatedHeaders, 'etag']);

    const assertExactAppendedHeadings = (candidateSource: string) => {
      expect(
        extractH2HeadingsAfter(candidateSource, '## Implementation notes')
      ).toEqual(headings);
    };
    assertExactAppendedHeadings(source);

    const duplicateHeadingSource = source.replace(
      headings[2],
      `${headings[2]}\n\n${headings[2]}`
    );
    expect(() => assertExactAppendedHeadings(duplicateHeadingSource)).toThrow();

    const interleavedHeadingSource = source.replace(
      `${headings[3]}\n\n`,
      `${headings[3]}\n\n## Unexpected appended heading\n\n`
    );
    expect(() => assertExactAppendedHeadings(interleavedHeadingSource)).toThrow();

    const extraHeadingSource = `${source}\n## Unexpected trailing heading\n`;
    expect(() => assertExactAppendedHeadings(extraHeadingSource)).toThrow();

    const setextHeadingSource = source.replace(
      `${headings[2]}\n\n`,
      `${headings[2]}\n\nUnexpected appended heading\n---------------------------\n\n`
    );
    expect(() => assertExactAppendedHeadings(setextHeadingSource)).toThrow();

    const assertBoundDownloadRequest = (candidateSource: string) => {
      const javascriptBlocks = [
        ...candidateSource.matchAll(/```js\r?\n([\s\S]*?)\r?\n```/g),
      ];
      const httpBlocks = [
        ...candidateSource.matchAll(/```http\r?\n([\s\S]*?)\r?\n```/g),
      ];

      expect(javascriptBlocks).toHaveLength(1);
      expect(httpBlocks).toHaveLength(1);

      const javascriptBlock = javascriptBlocks[0]?.[1] ?? '';
      const httpBlock = httpBlocks[0]?.[1] ?? '';
      const fetchRequest = javascriptBlock.match(
        /fetch\('(?<url>https:\/\/[^']+)', \{\r?\n\s+credentials: '(?<credentials>[^']+)'/
      );
      const fetchUrl = new URL(
        fetchRequest?.groups?.url ?? 'https://invalid.example'
      );
      const [rawHttpRequest = ''] = httpBlock.split(/\r?\n\r?\n/, 1);
      const [requestLine = '', ...requestHeaderLines] =
        rawHttpRequest.split(/\r?\n/);
      const httpRequest = requestLine.match(
        /^(?<method>[A-Z]+) (?<path>\/\S+) HTTP\/1\.1$/
      );
      const requestHeaders = new Map<string, string[]>();

      for (const line of requestHeaderLines) {
        const header = line.match(/^(?<name>[^:\s]+):[ \t]*(?<value>.*)$/);
        expect(header).not.toBeNull();

        const name = header?.groups?.name.toLowerCase() ?? '';
        const values = requestHeaders.get(name) ?? [];
        values.push(header?.groups?.value ?? '');
        requestHeaders.set(name, values);
      }

      expect(fetchRequest?.groups?.url).toBe(
        'https://files.example/reports/quarterly.pdf'
      );
      expect(fetchRequest?.groups?.credentials).toBe('include');
      expect(httpRequest?.groups?.method).toBe('GET');
      expect(httpRequest?.groups?.path).toBe('/reports/quarterly.pdf');
      expect(requestHeaders.get('host')).toEqual(['files.example']);
      expect(requestHeaders.get('origin')).toEqual(['https://app.example']);
      expect(requestHeaders.get('cookie')).toEqual([
        'download_session=opaque',
      ]);
      expect(fetchUrl.host).toBe(requestHeaders.get('host')?.[0]);
      expect(fetchUrl.pathname).toBe(httpRequest?.groups?.path);
      expect(javascriptBlock).toContain(
        "response.headers.get('Content-Disposition')"
      );
      expect(javascriptBlock).toContain("response.headers.get('ETag')");
      expect(javascriptBlock).toContain("response.headers.get('Set-Cookie')");

      for (const phrase of [
        'HTTP/1.1 200 OK',
        'Access-Control-Allow-Origin: https://app.example',
        'Access-Control-Allow-Credentials: true',
        'Access-Control-Expose-Headers: Content-Disposition, ETag',
        'Content-Type: application/pdf',
        'Content-Disposition: attachment; filename="quarterly-report.pdf"',
        'ETag: "report-v7"',
        'Set-Cookie: download_session=opaque; Secure; HttpOnly; SameSite=None',
        'Vary: Origin',
      ]) {
        expect(httpBlock).toContain(phrase);
      }
    };
    assertBoundDownloadRequest(source);

    const hostMismatchSource = source.replace(
      'Host: files.example',
      'Host: unrelated.example'
    );
    expect(() => assertBoundDownloadRequest(hostMismatchSource)).toThrow();

    const missingCookieSource = source.replace(
      'Cookie: download_session=opaque\n',
      ''
    );
    expect(() => assertBoundDownloadRequest(missingCookieSource)).toThrow();

    const assertExactSafelist = (candidateSource: string) => {
      const safelistParagraphs = extractInlineCodeParagraphsBetween(
        candidateSource,
        '## CORS-safelisted response headers',
        '## Wildcard and credentialed requests'
      );

      expect(
        safelistParagraphs.filter(({ inlineCodeValues }) =>
          inlineCodeValues.includes('Cache-Control')
        )
      ).toEqual([
        {
          inlineCodeValues: [
            'Access-Control-Expose-Headers',
            ...expectedSafelistedResponseHeaders,
          ],
          text: 'After a successful CORS exchange, Fetch makes these response field names readable without repeating them in Access-Control-Expose-Headers: Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified, Pragma.',
        },
      ]);
    };
    assertExactSafelist(source);

    const extraSafelistItemSource = source.replace(
      '`Last-Modified`, `Pragma`.\n\n',
      '`Last-Modified`, `Pragma`, `ETag`.\n\n'
    );
    expect(() => assertExactSafelist(extraSafelistItemSource)).toThrow();

    const reorderedSafelistSource = source.replace(
      '`Cache-Control`, `Content-Language`',
      '`Content-Language`, `Cache-Control`'
    );
    expect(() => assertExactSafelist(reorderedSafelistSource)).toThrow();

    const cookieBoundaryPhrases = [
      '`Set-Cookie` and legacy `Set-Cookie2` are forbidden response-header names under Fetch. A CORS-filtered response excludes them from browser JavaScript access even if `Set-Cookie` is explicitly named in `Access-Control-Expose-Headers`, wildcard semantics apply, the browser accepts the cookie, or the response includes `Access-Control-Allow-Credentials: true`.',
      'the browser can process an allowed cookie independently of exposing that field to JavaScript',
      '`HttpOnly` protects a stored cookie from script access through cookie APIs, while the Fetch response-header prohibition applies to the `Set-Cookie` field name itself',
    ];
    const assertCookieExposureBoundaries = (candidateSource: string) => {
      for (const phrase of cookieBoundaryPhrases) {
        expect(candidateSource).toContain(phrase);
      }
    };
    assertCookieExposureBoundaries(source);

    const explicitListBoundaryMutation = source.replace(
      'even if `Set-Cookie` is explicitly named in `Access-Control-Expose-Headers`, wildcard semantics apply, the browser accepts the cookie, or',
      'even if the response includes'
    );
    expect(() =>
      assertCookieExposureBoundaries(explicitListBoundaryMutation)
    ).toThrow();

    const forbiddenNameRuleMutation = source.replace(
      cookieBoundaryPhrases[0],
      '`Set-Cookie` and legacy `Set-Cookie2` may be exposed to browser JavaScript when listed or when wildcard semantics apply.'
    );
    expect(() =>
      assertCookieExposureBoundaries(forbiddenNameRuleMutation)
    ).toThrow();

    const cookieProcessingBoundaryMutation = source.replace(
      'the browser can process an allowed cookie independently of exposing that field to JavaScript',
      'the browser can process an allowed cookie'
    );
    expect(() =>
      assertCookieExposureBoundaries(cookieProcessingBoundaryMutation)
    ).toThrow();

    const httpOnlyBoundaryMutation = source.replace(
      '`HttpOnly` protects a stored cookie from script access through cookie APIs, while the Fetch response-header prohibition applies to the `Set-Cookie` field name itself',
      '`HttpOnly` is a cookie attribute'
    );
    expect(() => assertCookieExposureBoundaries(httpOnlyBoundaryMutation)).toThrow();

    for (const phrase of [
      'bounded, case-insensitive list of field names',
      'internal routing or upstream identity',
      'identifiers that enable correlation across users, sessions, or services',
      '`disposition` contains `attachment; filename="quarterly-report.pdf"`',
      '`etag` contains `"report-v7"`',
      '`setCookie` is `null`',
      'network tooling can display the internal network response while Fetch exposes a CORS-filtered response',
      'Both an absent field and a present-but-filtered field can make `Headers.get()` return `null`',
      '`Content-Disposition` and `ETag` are not in this safelist',
      'Do not confuse this response-header-name safelist with the CORS-safelisted request-header rules',
      'credentials mode is not `include`, `Access-Control-Expose-Headers: *` exposes all response header names except forbidden response-header names',
      'credentials mode is `include`, `*` is treated as the literal field name `*`',
      'do not duplicate session tokens or cookie values into an exposed custom response field',
      'does not authorize the request or decide which record the caller may receive',
      'does not redact or validate an exposed value',
      '`Access-Control-Allow-Headers` is the opposite request direction',
      'curl, server-to-server clients, proxies, extensions, or other non-browser tooling',
    ]) {
      expect(source).toContain(phrase);
    }
  });

  it('keeps Vary aligned with CORS-aware HTTP cache matching intent', () => {
    const source = readFileSync(
      new URL('src/content/headers/vary.md', PROJECT_ROOT),
      'utf8'
    );
    const frontmatter = getOpeningFrontmatter(source);
    const expectedRelatedHeaders = [
      'access-control-allow-origin',
      'access-control-max-age',
      'cache-control',
      'etag',
      'content-encoding',
    ];
    const approvedHeadings = [
      '## What Vary changes in cache matching',
      '## Why dynamic Access-Control-Allow-Origin needs Vary: Origin',
      '## How a missing Vary: Origin breaks cached CORS responses',
      '## Debug Vary and the effective cache key',
      '## HTTP response cache vs CORS preflight cache',
      '## Common Vary patterns and cache fragmentation',
      '## Vary: * vs private and no-store',
    ];
    const expectedH2Headings = [
      '## Meaning and behavior',
      '## Implementation notes',
      ...approvedHeadings,
    ];

    expect(frontmatter).toBeDefined();
    expect(frontmatter?.match(/^relatedHeaders:/gm)).toHaveLength(1);
    expect(parseFrontmatterList(frontmatter ?? '', 'relatedHeaders')).toEqual(
      expectedRelatedHeaders
    );

    const bypassSource = source.replace(
      '  - content-encoding\nreferences:',
      '  - content-encoding\n\n  # This comment must not hide another item.\n  - content-language\nreferences:'
    );
    const bypassFrontmatter = getOpeningFrontmatter(bypassSource);

    expect(
      parseFrontmatterList(bypassFrontmatter ?? '', 'relatedHeaders')
    ).toEqual([...expectedRelatedHeaders, 'content-language']);

    const assertExactH2Headings = (candidateSource: string) => {
      expect(
        collectMarkdownContractNodes(candidateSource).h2Headings
          .map(({ text }) => `## ${text}`)
      ).toEqual(expectedH2Headings);
    };
    assertExactH2Headings(source);

    const duplicateHeadingSource = source.replace(
      approvedHeadings[2],
      `${approvedHeadings[2]}\n\n${approvedHeadings[2]}`
    );
    expect(() => assertExactH2Headings(duplicateHeadingSource)).toThrow();

    const unexpectedHeadingSource = source.replace(
      `${approvedHeadings[4]}\n\n`,
      `${approvedHeadings[4]}\n\n## Unexpected cache section\n\n`
    );
    expect(() => assertExactH2Headings(unexpectedHeadingSource)).toThrow();

    const headingBeforeBoundarySource = source.replace(
      '## Implementation notes',
      `${approvedHeadings[0]}\n\n## Implementation notes`
    );
    expect.soft(() =>
      assertExactH2Headings(headingBeforeBoundarySource)
    ).toThrow();

    const expectedHttpBlocks = [
      'Vary: Accept-Encoding, Accept-Language',
      [
        'HTTP/1.1 200 OK',
        'Access-Control-Allow-Origin: https://app.example',
        'Cache-Control: public, max-age=300',
        'Content-Type: application/json',
        'Vary: Origin',
      ].join('\n'),
      [
        'GET /public-config HTTP/1.1',
        'Host: api.example',
        'Origin: https://app.example',
        '',
        'HTTP/1.1 200 OK',
        'Access-Control-Allow-Origin: https://app.example',
        'Cache-Control: public, max-age=300',
        'Content-Type: application/json',
        '',
        'GET /public-config HTTP/1.1',
        'Host: api.example',
        'Origin: https://admin.example',
        '',
        'HTTP/1.1 200 OK',
        'Access-Control-Allow-Origin: https://app.example',
        'Age: 42',
        'Cache-Control: public, max-age=300',
        'Content-Type: application/json',
      ].join('\n'),
      [
        'GET /public-config HTTP/1.1',
        'Host: api.example',
        'Origin: https://admin.example',
        '',
        'HTTP/1.1 200 OK',
        'Access-Control-Allow-Origin: https://admin.example',
        'Cache-Control: public, max-age=300',
        'Content-Type: application/json',
        'Vary: Origin',
      ].join('\n'),
    ];

    const assertBoundCacheExamples = (candidateSource: string) => {
      expect(
        collectMarkdownContractNodes(candidateSource).httpCodeBlocks
      ).toEqual(expectedHttpBlocks);
    };
    assertBoundCacheExamples(source);

    const brokenExampleWithVary = source.replace(
      'Content-Type: application/json\n\nGET /public-config HTTP/1.1',
      'Content-Type: application/json\nVary: Origin\n\nGET /public-config HTTP/1.1'
    );
    expect(() => assertBoundCacheExamples(brokenExampleWithVary)).toThrow();

    const correctedOriginMismatch = source.replace(
      'Access-Control-Allow-Origin: https://admin.example\nCache-Control: public, max-age=300\nContent-Type: application/json\nVary: Origin',
      'Access-Control-Allow-Origin: https://app.example\nCache-Control: public, max-age=300\nContent-Type: application/json\nVary: Origin'
    );
    expect(() => assertBoundCacheExamples(correctedOriginMismatch)).toThrow();

    const suffixedCorrectedOrigin = source.replace(
      'Origin: https://admin.example\n\nHTTP/1.1 200 OK\nAccess-Control-Allow-Origin: https://admin.example',
      'Origin: https://admin.example.evil\n\nHTTP/1.1 200 OK\nAccess-Control-Allow-Origin: https://admin.example.evil'
    );
    expect.soft(() => assertBoundCacheExamples(suffixedCorrectedOrigin)).toThrow();

    const suffixedVaryField = source.replace(
      'Content-Type: application/json\nVary: Origin',
      'Content-Type: application/json\nVary: Origin-Policy'
    );
    expect.soft(() => assertBoundCacheExamples(suffixedVaryField)).toThrow();

    const expectedInternalLinkDestinations = [
      '/headers/cache-control/',
      '/headers/etag/',
      '/headers/access-control-allow-origin/',
      '/headers/access-control-max-age/',
      '/headers/content-encoding/',
      '/http-headers-checker/',
    ];
    const assertRequiredLinks = (candidateSource: string) => {
      expect(
        collectMarkdownContractNodes(candidateSource).linkDestinations
          .filter((destination) => destination.startsWith('/'))
      ).toEqual(expectedInternalLinkDestinations);
    };
    assertRequiredLinks(source);

    const accessControlMaxAgeLink =
      '[Access-Control-Max-Age](/headers/access-control-max-age/)';
    const nonRenderedLinkSource = source.replace(
      accessControlMaxAgeLink,
      `Access-Control-Max-Age<!-- ${accessControlMaxAgeLink} -->`
    );
    expect.soft(() => assertRequiredLinks(nonRenderedLinkSource)).toThrow();
  });

  it('keeps Server-Timing aligned with the debugging-first guide contract', () => {
    const source = readFileSync(
      new URL('src/content/headers/server-timing.md', PROJECT_ROOT),
      'utf8'
    );
    const frontmatter = getOpeningFrontmatter(source);
    const contract = collectMarkdownContractNodes(source);
    const expectedH2Headings = [
      '## Meaning and behavior',
      '## Implementation notes',
      '## Where Server-Timing fits in a request',
      '## Server-Timing syntax: names, dur, and desc',
      '## Inspect Server-Timing in browser DevTools',
      '## Read Server-Timing from JavaScript',
      '## Add Server-Timing in Express',
      '## Add Server-Timing in a Cloudflare Worker',
      '## Cross-origin metrics and Timing-Allow-Origin',
      '## Debug missing or misleading Server-Timing metrics',
      '## Design production metrics without leaking internals',
    ];

    const assertExactH2Headings = (candidateSource: string) => {
      expect(
        collectMarkdownContractNodes(candidateSource).h2Headings
          .map(({ text }) => `## ${text}`)
      ).toEqual(expectedH2Headings);
    };
    assertExactH2Headings(source);

    expect(frontmatter).toBeDefined();
    expect(frontmatter?.match(/^relatedHeaders:/gm)).toHaveLength(1);
    expect(parseFrontmatterList(frontmatter ?? '', 'relatedHeaders')).toEqual([
      'timing-allow-origin',
      'x-runtime',
      'cache-control',
    ]);

    const assertTimelineSemantics = (candidateSource: string) => {
      const dom = new JSDOM(
        collectMarkdownContractNodes(candidateSource).htmlBlocks.join('\n')
      );
      const timeline = dom.window.document.querySelectorAll(
        'figure[data-server-timing-timeline]'
      );

      expect(timeline).toHaveLength(1);
      expect(timeline[0]?.querySelectorAll('figcaption')).toHaveLength(1);
      const requestPath = timeline[0]?.querySelector('[data-request-path]');
      const timingIllustration = timeline[0]?.querySelector(
        '[data-timing-illustration]'
      );

      expect(requestPath).not.toBeNull();
      expect(timingIllustration).not.toBeNull();
      expect(requestPath?.querySelector('[data-timeline-path]')).not.toBeNull();
      expect(requestPath?.querySelector('[data-timing-phase]')).toBeNull();
      expect(timingIllustration?.querySelector('[data-timeline-path]')).toBeNull();
      expect(timingIllustration?.querySelectorAll('[data-timing-phase]')).toHaveLength(3);
      expect(
        timingIllustration?.querySelectorAll('[data-not-in-server-timing]')
      ).toHaveLength(1);
      expect(timeline[0]?.querySelectorAll('[data-timeline-path] > li')).toHaveLength(4);
      expect(timeline[0]?.querySelectorAll('[data-timing-phase]')).toHaveLength(3);
      expect(timeline[0]?.querySelector('[data-timing-total]')).not.toBeNull();
      expect(timeline[0]?.querySelector('script')).toBeNull();
    };
    assertTimelineSemantics(source);

    const javascriptBlocks = contract.codeBlocks.filter(({ lang }) => lang === 'js');
    const typescriptBlocks = contract.codeBlocks.filter(({ lang }) => lang === 'ts');
    const httpBlocks = contract.codeBlocks.filter(({ lang }) => lang === 'http');

    expect(javascriptBlocks).toHaveLength(2);
    expect(typescriptBlocks).toHaveLength(1);
    expect(httpBlocks.length).toBeGreaterThanOrEqual(5);

    for (const block of javascriptBlocks) {
      expectParseableScript(block.value, ts.ScriptKind.JS);
    }
    expectParseableScript(typescriptBlocks[0]?.value ?? '', ts.ScriptKind.TS);

    const assertStreamingWorkerExample = (candidateSource: string) => {
      const workerExample = collectMarkdownContractNodes(candidateSource).codeBlocks
        .find(({ lang }) => lang === 'ts')?.value ?? '';

      expect(workerExample).toMatch(/await fetch\(new Request\(upstreamUrl, request\)\)/);
      expect(workerExample).toMatch(/new Response\(upstreamResponse\.body,/);
      expect(workerExample).not.toMatch(/upstreamResponse\.(text|json|arrayBuffer|blob)\(/);
    };
    assertStreamingWorkerExample(source);

    const expressExample = javascriptBlocks.find(({ value }) =>
      value.includes("app.get('/products'")
    )?.value ?? '';
    expect(expressExample).toContain("response.setHeader(\n    'Server-Timing'");
    expect(expressExample.indexOf('response.setHeader')).toBeLessThan(
      expressExample.indexOf("response.type('application/json').send(body)")
    );

    expect(
      contract.tables.some(({ columnCount, rowCount }) =>
        columnCount === 3 && rowCount >= 9
      )
    ).toBe(true);

    const expectedLinks = [
      '/headers/timing-allow-origin/',
      '/headers/x-runtime/',
      '/headers/cache-control/',
    ];
    const assertRequiredLinks = (candidateSource: string) => {
      expect(
        collectMarkdownContractNodes(candidateSource).linkDestinations
      ).toEqual(expect.arrayContaining(expectedLinks));
    };
    assertRequiredLinks(source);

    const duplicateHeadingSource = source.replace(
      expectedH2Headings[2],
      `${expectedH2Headings[2]}\n\n${expectedH2Headings[2]}`
    );
    expect(() => assertExactH2Headings(duplicateHeadingSource)).toThrow();

    const unexpectedHeadingSource = source.replace(
      `${expectedH2Headings[3]}\n\n`,
      `${expectedH2Headings[3]}\n\n## Unexpected timing section\n\n`
    );
    expect(() => assertExactH2Headings(unexpectedHeadingSource)).toThrow();

    const missingFigcaptionSource = source.replace(
      /<figcaption>[\s\S]*?<\/figcaption>/,
      ''
    );
    expect(() => assertTimelineSemantics(missingFigcaptionSource)).toThrow();

    const bufferedWorkerSource = source.replace(
      'upstreamResponse.body',
      'await upstreamResponse.text()'
    );
    expect(() => assertStreamingWorkerExample(bufferedWorkerSource)).toThrow();

    const removedContextualLinkSource = source.replace(
      '[Timing-Allow-Origin](/headers/timing-allow-origin/)',
      'Timing-Allow-Origin'
    );
    expect(() => assertRequiredLinks(removedContextualLinkSource)).toThrow();
  });

  it('keeps network-path incoming URLs on the fixed Worker upstream origin', async () => {
    const source = readFileSync(
      new URL('src/content/headers/server-timing.md', PROJECT_ROOT),
      'utf8'
    );
    const workerExample = collectMarkdownContractNodes(source).codeBlocks
      .find(({ lang }) => lang === 'ts')?.value ?? '';
    const executableWorkerExample = ts.transpileModule(workerExample, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const workerModuleUrl = `data:text/javascript;base64,${Buffer.from(
      executableWorkerExample
    ).toString('base64')}`;
    const fetchedRequests: Request[] = [];

    vi.stubGlobal('fetch', async (request: Request) => {
      fetchedRequests.push(request);
      return new Response('upstream body', {
        status: 201,
        statusText: 'Created',
      });
    });

    try {
      const workerModule = await import(/* @vite-ignore */ workerModuleUrl) as {
        default: {
          fetch(request: Request): Promise<Response>;
        };
      };

      await workerModule.default.fetch(
        new Request(
          'https://worker.example//attacker.example/collect?token=redacted'
        )
      );

      expect(fetchedRequests).toHaveLength(1);
      const fetchedUrl = new URL(fetchedRequests[0]?.url ?? '');
      expect(fetchedUrl.origin).toBe('https://origin.example');
      expect(fetchedUrl.pathname).toBe('//attacker.example/collect');
      expect(fetchedUrl.search).toBe('?token=redacted');
    } finally {
      vi.unstubAllGlobals();
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
