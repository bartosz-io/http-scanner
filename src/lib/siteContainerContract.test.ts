import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);
const globalCss = readFileSync(
  new URL('src/styles/global.css', projectRoot),
  'utf8'
);
const astroLayoutFiles = [
  'src/components/astro/SiteHeader.astro',
  'src/components/astro/SiteFooter.astro',
  'src/pages/index.astro',
  'src/components/astro/HomepageSeoContent.astro',
  'src/pages/reports.astro',
  'src/pages/report/index.astro',
  'src/pages/404.astro',
];

describe('site container contract', () => {
  it('defines one plain CSS site-container at 1200px', () => {
    expect(globalCss).toContain('.site-container {');
    expect(globalCss).toContain('max-width: 1200px;');
    expect(globalCss.match(/\.site-container\s*\{/g)).toHaveLength(1);
    expect(globalCss).not.toContain('@utility site-container');
    expect(globalCss).not.toContain('@layer site-container');
  });

  it('uses site-container on every Astro application surface', () => {
    for (const file of astroLayoutFiles) {
      const source = readFileSync(new URL(file, projectRoot), 'utf8');

      expect(source, file).toContain('site-container');
      expect(source, file).not.toMatch(/class="container(?:\s|"|$)/);
    }
  });

  it('keeps the scan-results reading width inside the shared layout container', () => {
    const homepageSeoSource = readFileSync(
      new URL('src/components/astro/HomepageSeoContent.astro', projectRoot),
      'utf8'
    );

    expect(homepageSeoSource).toContain(
      '<div class="site-container mx-auto px-4 py-14 sm:py-16">\n    <div class="mx-auto grid max-w-5xl gap-8'
    );
    expect(homepageSeoSource).not.toContain(
      'site-container mx-auto grid max-w-5xl'
    );
  });

  it('does not alter the component query utility', () => {
    const cardSource = readFileSync(
      new URL('src/components/ui/card.tsx', projectRoot),
      'utf8'
    );

    expect(cardSource).toContain('@container/card-header');
  });
});
