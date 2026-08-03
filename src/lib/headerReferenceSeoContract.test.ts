import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = new URL('../../', import.meta.url);

function readProjectFile(path: string): string {
  const fileUrl = new URL(path, PROJECT_ROOT);
  expect(existsSync(fileUrl), `Missing ${path}`).toBe(true);
  return readFileSync(fileUrl, 'utf8');
}

describe('HTTP header reference SEO contract', () => {
  it('publishes the approved index metadata and heading', () => {
    const page = readProjectFile('src/pages/headers/index.astro');

    expect(page).toContain('HTTP Header Reference | HTTP Scanner');
    expect(page).toContain('canonicalPath="/headers/"');
    expect(page).toContain('<HeaderReferenceIndex');

    const component = readProjectFile('src/components/astro/HeaderReferenceIndex.astro');
    expect(component).toContain('HTTP Response Header Reference');
    expect(component).toContain('data-analytics-event="checker to guide clicked"');
    expect(component).toContain('data-analytics-event="guide to checker clicked"');
    expect(component).not.toContain('client:');
  });

  it('generates catalog-backed static guide routes with unique metadata', () => {
    const route = readProjectFile('src/pages/headers/[slug].astro');

    expect(route).toContain('getStaticPaths');
    expect(route).toContain("getCollection('headers')");
    expect(route).toContain('getHeaderCatalogEntry');
    expect(route).toContain('HTTP Header — Syntax & Examples | HTTP Scanner');
    expect(route).toContain('guide.data.description');
    expect(route).toContain('<HeaderGuidePage');

    const component = readProjectFile('src/components/astro/HeaderGuidePage.astro');
    expect(component).toContain('data-analytics-header-name={catalogEntry.displayName}');
    expect(component).toContain('data-analytics-event="guide to checker clicked"');
    expect(component).not.toContain('client:');
  });
});
