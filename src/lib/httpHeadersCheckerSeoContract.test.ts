import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(
  new URL('../pages/http-headers-checker/index.astro', import.meta.url),
  'utf8'
);
const contentSource = readFileSync(
  new URL('../components/astro/HttpHeadersCheckerContent.astro', import.meta.url),
  'utf8'
);
const siteHeaderSource = readFileSync(
  new URL('../components/astro/SiteHeader.astro', import.meta.url),
  'utf8'
);
const siteFooterSource = readFileSync(
  new URL('../components/astro/SiteFooter.astro', import.meta.url),
  'utf8'
);
const homepageContentSource = readFileSync(
  new URL('../components/astro/HomepageSeoContent.astro', import.meta.url),
  'utf8'
);
const normalizedContentSource = contentSource.replace(/\s+/g, ' ');

describe('HTTP headers checker SEO contract', () => {
  it('owns the all-response-headers search intent', () => {
    expect(pageSource).toContain(
      "const title = 'HTTP Headers Checker — View Response Headers | HTTP Scanner';"
    );
    expect(pageSource).toContain(
      "const description = 'Check all HTTP response headers returned by any public website. Search header names and values, understand common fields, and inspect the result for free.';"
    );
    expect(pageSource).toContain('Free HTTP Headers Checker');
    expect(pageSource).toContain('canonicalPath="/http-headers-checker/"');
    expect(pageSource).toContain(
      '<ScannerIsland resultView="all-headers" client:load />'
    );
  });

  it('keeps the scanner ahead of the static explanation', () => {
    expect(pageSource.indexOf('<ScannerIsland')).toBeLessThan(
      pageSource.indexOf('<HttpHeadersCheckerContent />')
    );
  });

  it('renders the complete explanation without hydrating it', () => {
    for (const heading of [
      'What are HTTP response headers?',
      'How to check HTTP headers',
      'Response header categories',
      'Example HTTP response headers',
      'What this checker can and cannot show',
      'HTTP headers checker FAQ',
    ]) {
      expect(contentSource, heading).toContain(heading);
    }

    expect(contentSource).not.toContain('FAQPage');
    expect(contentSource).not.toContain('application/ld+json');
    expect(contentSource).not.toContain('client:');
  });

  it('is discoverable from shared navigation and homepage context', () => {
    for (const source of [
      siteHeaderSource,
      siteFooterSource,
      homepageContentSource,
    ]) {
      expect(source).toContain('href="/http-headers-checker/"');
    }

    expect(siteHeaderSource).toContain('HTTP Headers');
    expect(siteHeaderSource).toContain('href="/headers/"');
    expect(siteHeaderSource).toContain('Header Reference');
    expect(siteFooterSource).toContain('HTTP Headers Checker');
    expect(homepageContentSource).toContain('View all HTTP response headers');
  });

  it('keeps the primary navigation usable at narrow viewport widths', () => {
    expect(siteHeaderSource).toContain(
      '<span class="hidden text-xl font-bold sm:inline">HTTP Scanner</span>'
    );
    expect(siteHeaderSource).toContain(
      '<span class="md:hidden">Security</span>'
    );
    expect(siteHeaderSource).toContain(
      '<span class="hidden md:inline">Security Scanner</span>'
    );
    expect(siteHeaderSource).toContain(
      '<span class="md:hidden">Headers</span>'
    );
    expect(siteHeaderSource).toContain(
      '<span class="hidden md:inline">HTTP Headers</span>'
    );
    expect(siteHeaderSource).toContain(
      '<span class="md:hidden">Reference</span>'
    );
    expect(siteHeaderSource).toContain(
      '<span class="hidden md:inline">Header Reference</span>'
    );
    expect(siteHeaderSource).toContain('<li class="hidden sm:block">');
    expect(siteHeaderSource.match(/px-2 text-sm sm:px-4/g)).toHaveLength(4);
  });

  it('states the scanner observation and security boundaries accurately', () => {
    expect(normalizedContentSource).toContain(
      'Values reflect what the Cloudflare Worker observed'
    );
    expect(normalizedContentSource).toContain(
      'not a guaranteed direct response from the origin server'
    );
    expect(normalizedContentSource).toContain(
      'Known scanner-transport headers are excluded'
    );
    expect(normalizedContentSource).toContain(
      'Visible Set-Cookie response values are shown unmasked as captured by the scanner.'
    );
    expect(normalizedContentSource).not.toContain('exactly as the scanner observed');
    expect(normalizedContentSource).toContain(
      'Custom and less common fields can still appear under Other'
    );
    expect(normalizedContentSource).toContain(
      'This neutral view is not a vulnerability assessment.'
    );
  });

  it('uses a valid HTTP status line in the static response example', () => {
    expect(contentSource).toContain('HTTP/1.1 200 OK');
    expect(contentSource).not.toContain('HTTP/2 200 OK');
  });

  it('links to the reference index and six popular header guides', () => {
    expect(contentSource).toContain('href="/headers/"');
    for (const slug of [
      'cache-control',
      'content-type',
      'set-cookie',
      'content-security-policy',
      'server-timing',
      'access-control-allow-origin',
    ]) {
      expect(contentSource).toContain(`href={\`/headers/\${${'entry.slug'}}/\`}`);
      expect(contentSource).toContain(`'${slug}'`);
    }
    expect(contentSource).toContain('data-analytics-event="checker to guide clicked"');
  });
});
