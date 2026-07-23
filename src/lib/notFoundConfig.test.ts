import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static 404 configuration', () => {
  it('configures Cloudflare to serve the generated 404 page', () => {
    const config = readFileSync('wrangler.jsonc', 'utf8');

    expect(config).toMatch(/"not_found_handling":\s*"404-page"/);
  });

  it('defines a noindex Astro 404 page', () => {
    const page = readFileSync('src/pages/404.astro', 'utf8');

    expect(page).toContain('noindex');
    expect(page).toContain('Page not found');
    expect(page).toContain('href="/"');
  });
});
