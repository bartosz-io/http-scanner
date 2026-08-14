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

  it('renders fenced guide code as light cards without arbitrary wrapping', () => {
    const component = readProjectFile(
      'src/components/astro/HeaderGuidePage.astro'
    );

    for (const phrase of [
      '.guide-markdown :global(pre.astro-code)',
      'margin-top: 1rem;',
      'max-width: 100%;',
      'overflow-x: auto;',
      'border: 1px solid var(--border);',
      'border-radius: 0.625rem;',
      'padding: 1.25rem;',
      'font-size: 0.875rem;',
      'line-height: 1.25rem;',
      'white-space: pre;',
      'background-color: color-mix(',
      'var(--muted) 30%',
      'color: var(--foreground) !important;',
      '.guide-markdown :global(pre.astro-code span)',
      'color: inherit !important;',
      '.guide-markdown :global(pre code)',
      'overflow-wrap: normal;',
      'word-break: normal;',
    ]) {
      expect(component).toContain(phrase);
    }

    expect(component).toContain(
      '.guide-markdown :global(code) {\n    overflow-wrap: anywhere;'
    );
  });

  it('scopes the static Server-Timing timeline styles to its data contract', () => {
    const component = readProjectFile(
      'src/components/astro/HeaderGuidePage.astro'
    );

    expect(component).toContain(
      '.guide-markdown :global(figure[data-server-timing-timeline])'
    );
    expect(component).toContain(
      '.guide-markdown :global([data-server-timing-timeline] [data-timeline-path])'
    );
    expect(component).toContain(
      '.guide-markdown :global([data-server-timing-timeline] [data-server-timing-publication])'
    );
    expect(component).toContain(
      '.guide-markdown :global([data-server-timing-timeline] [data-published-metrics])'
    );
    expect(component).toContain(
      '.guide-markdown :global([data-server-timing-timeline] [data-published-metric])'
    );
    expect(component).toContain(
      '.guide-markdown :global([data-server-timing-timeline] [data-timeline-path] li) {\n    margin-top: 0;'
    );
    expect(component).toContain('@media (max-width: 640px)');
    expect(component).not.toContain('.guide-markdown :global(figure) {');
    expect(component).not.toContain('[data-timing-total]');
    expect(component).not.toContain('[data-timing-breakdown]');
    expect(component).not.toContain('[data-timing-phase]');
    expect(component).not.toContain('[data-not-in-server-timing]');
    expect(component).not.toContain('client:');
  });
});
