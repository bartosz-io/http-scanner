import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { securityHeaderParsers } from '../../worker/impl/parsers/security';
import { homepageSecurityHeaderGroups } from './homepageSecurityHeaders';

const homepageSource = readFileSync(
  new URL('../pages/index.astro', import.meta.url),
  'utf8'
);
const seoContentSource = readFileSync(
  new URL('../components/astro/HomepageSeoContent.astro', import.meta.url),
  'utf8'
);

describe('homepage SEO contract', () => {
  it('owns the security headers checker search intent', () => {
    expect(homepageSource).toContain(
      "const title = 'Free Security Headers Checker | HTTP Scanner';"
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
    const contentPosition = homepageSource.indexOf('<HomepageSeoContent />');
    const recentScansPosition = homepageSource.indexOf(
      '<RecentScansIsland client:visible />'
    );

    expect(headingPosition).toBeGreaterThan(-1);
    expect(scannerPosition).toBeGreaterThan(headingPosition);
    expect(contentPosition).toBeGreaterThan(scannerPosition);
    expect(recentScansPosition).toBeGreaterThan(contentPosition);
  });

  it('renders the approved explanation as static Astro content', () => {
    expect(homepageSource).toContain('<HomepageSeoContent />');
    expect(homepageSource).not.toContain('<HomepageSeoContent client:');
    expect(seoContentSource).not.toContain('client:');

    for (const heading of [
      'What does the security headers checker do?',
      'Which security headers are checked?',
      'How to check your website’s security headers',
      'How to interpret the scan results',
      'What this security header scanner does not test',
      'Security headers FAQ',
    ]) {
      expect(seoContentSource, heading).toContain(heading);
    }
  });

  it('states the scanner boundary without FAQ structured data', () => {
    expect(seoContentSource).toContain(
      'not a complete website vulnerability scanner or penetration test'
    );
    expect(seoContentSource).toContain(
      'It does not prove that the website is free from vulnerabilities.'
    );
    expect(seoContentSource).not.toContain('FAQPage');
    expect(seoContentSource).not.toContain('application/ld+json');
  });

  it('lists every registered security parser exactly once', () => {
    const displayedHeaders = homepageSecurityHeaderGroups
      .flatMap((group) => group.headers)
      .map((header) => header.toLowerCase())
      .sort();
    const registeredHeaders = Object.keys(securityHeaderParsers).sort();

    expect(new Set(displayedHeaders).size).toBe(displayedHeaders.length);
    expect(displayedHeaders).toEqual(registeredHeaders);
  });
});
