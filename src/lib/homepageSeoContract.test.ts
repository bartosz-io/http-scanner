import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homepageSource = readFileSync(
  new URL('../pages/index.astro', import.meta.url),
  'utf8'
);

describe('homepage SEO contract', () => {
  it('owns the security headers checker search intent', () => {
    expect(homepageSource).toContain(
      "const title = 'Security Headers Checker — Free HTTP Security Scan';"
    );
    expect(homepageSource).toContain(
      "const description = 'Check your website’s HTTP security headers for missing or weak CSP, HSTS, X-Frame-Options, Permissions-Policy and more. Get a free, actionable report.';"
    );
    expect(homepageSource).toContain('Free Security Headers Checker');
    expect(homepageSource).toContain(
      'Check the HTTP security headers of any public website.'
    );
  });

  it('keeps the canonical homepage and scanner-first interaction', () => {
    expect(homepageSource).toContain('canonicalPath="/"');
    expect(homepageSource).toContain('<ScannerIsland client:load />');

    const headingPosition = homepageSource.indexOf(
      'Free Security Headers Checker'
    );
    const scannerPosition = homepageSource.indexOf(
      '<ScannerIsland client:load />'
    );

    expect(headingPosition).toBeGreaterThan(-1);
    expect(scannerPosition).toBeGreaterThan(headingPosition);
  });
});
