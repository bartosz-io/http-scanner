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

describe('HTTP headers checker SEO contract', () => {
  it('owns the all-response-headers search intent', () => {
    expect(pageSource).toContain(
      "const title = 'HTTP Headers Checker — View Response Headers | HTTP Scanner';"
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
    expect(siteFooterSource).toContain('HTTP Headers Checker');
    expect(homepageContentSource).toContain('View all HTTP response headers');
  });

  it('does not publish links to the future header reference library', () => {
    expect(pageSource).not.toContain('href="/headers/');
    expect(contentSource).not.toContain('href="/headers/');
  });
});
