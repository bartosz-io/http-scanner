# Global Layout Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the wide shared application containers with one plain-CSS `site-container` capped at 1200px on desktop while preserving mobile behavior and page functionality.

**Architecture:** Define `.site-container` once in `src/styles/global.css` as a normal CSS class, independent of Tailwind directives. Migrate every full-width application surface to that class, while leaving component query classes and internal `max-w-*` reading constraints untouched.

**Tech Stack:** Astro 7, React 19, TypeScript, plain CSS in the existing global stylesheet, Vitest, ESLint, and Astro static build.

## Global Constraints

- Use a plain `.site-container` CSS class; do not add `@utility`, `@layer`, a new package, or a new dependency.
- `site-container` must have `width: 100%`, `max-width: 1200px`, and `margin-inline: auto` in one definition.
- Preserve existing `mx-auto`, horizontal padding, breakpoints, typography, spacing, and component behavior.
- Do not change scanner, report, API, or Worker logic.
- Do not change internal `max-w-*` constraints.
- Do not change the `@container/card-header` component query in `src/components/ui/card.tsx`.
- Migrate the exact in-scope surfaces listed in the approved spec.
- No horizontal overflow may be introduced at mobile widths.

## File Structure

- Create `src/lib/siteContainerContract.test.ts` to enforce one CSS definition and the exact in-scope class migration.
- Modify `src/styles/global.css` to define the plain `.site-container` class.
- Modify Astro layout surfaces: `SiteHeader.astro`, `SiteFooter.astro`, `src/pages/index.astro`, `HomepageSeoContent.astro`, `src/pages/reports.astro`, `src/pages/report/index.astro`, and `src/pages/404.astro`.
- Modify React layout surfaces: `src/components/report/ReportView.tsx` and `src/components/islands/ReportIsland.tsx`.

---

### Task 1: Add the plain CSS container and migrate Astro surfaces

**Files:**
- Create: `src/lib/siteContainerContract.test.ts`
- Modify: `src/styles/global.css`
- Modify: `src/components/astro/SiteHeader.astro`
- Modify: `src/components/astro/SiteFooter.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/components/astro/HomepageSeoContent.astro`
- Modify: `src/pages/reports.astro`
- Modify: `src/pages/report/index.astro`
- Modify: `src/pages/404.astro`

**Interfaces:**
- Consumes: existing layout class strings and the global stylesheet imported by `BaseLayout.astro`.
- Produces: one `.site-container` CSS definition and Astro pages using `site-container` for full-width layout.

- [ ] **Step 1: Write the failing source contract**

Create `src/lib/siteContainerContract.test.ts`:

```ts
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

  it('does not alter the component query utility', () => {
    const cardSource = readFileSync(
      new URL('src/components/ui/card.tsx', projectRoot),
      'utf8'
    );

    expect(cardSource).toContain('@container/card-header');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm test -- src/lib/siteContainerContract.test.ts
```

Expected: FAIL because `.site-container` is not defined and the Astro surfaces
still use `container`.

- [ ] **Step 3: Add the single plain CSS definition**

Append the following to `src/styles/global.css` after the existing base styles:

```css
.site-container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
}
```

Do not add a Tailwind directive, duplicate the class, or remove the existing
Tailwind import. Tailwind remains an existing project dependency used by other
styles; this layout class itself is plain CSS.

- [ ] **Step 4: Migrate the Astro class strings**

In each of the seven Astro files, replace only the layout token:

```diff
- <div class="container mx-auto px-4">
+ <div class="site-container mx-auto px-4">
```

Apply the same token replacement to sections and fallback slots with additional
classes, such as `class="container mx-auto space-y-4 px-4 py-8"`. Keep every
other class unchanged, including all `max-w-*` values and padding.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run:

```bash
npm test -- src/lib/siteContainerContract.test.ts
```

Expected: 3 tests pass with no warnings or failures.

- [ ] **Step 6: Commit the Astro migration**

Run:

```bash
git add src/lib/siteContainerContract.test.ts src/styles/global.css src/components/astro/SiteHeader.astro src/components/astro/SiteFooter.astro src/pages/index.astro src/components/astro/HomepageSeoContent.astro src/pages/reports.astro src/pages/report/index.astro src/pages/404.astro
git commit -m "style: narrow Astro application containers"
```

Expected: one focused commit containing the CSS class, contract, and Astro
surface migration.

---

### Task 2: Migrate React report surfaces and complete verification

**Files:**
- Modify: `src/lib/siteContainerContract.test.ts`
- Modify: `src/components/report/ReportView.tsx`
- Modify: `src/components/islands/ReportIsland.tsx`

**Interfaces:**
- Consumes: `.site-container` from `src/styles/global.css` and the Astro migration completed in Task 1.
- Produces: report loading, report view, and report island surfaces using the same 1200px layout class.

- [ ] **Step 1: Extend the contract to the React report surfaces**

Add these paths to the contract's layout file list:

```ts
  'src/components/report/ReportView.tsx',
  'src/components/islands/ReportIsland.tsx',
```

Change the source assertion to support both Astro and React class syntax:

```ts
expect(source, file).toContain('site-container');
expect(source, file).not.toMatch(/(?:class|className)="container(?:\s|"|$)/);
```

Run:

```bash
npm test -- src/lib/siteContainerContract.test.ts
```

Expected: FAIL because both React files still contain `container`.

- [ ] **Step 2: Replace only the React layout token**

In `ReportView.tsx` and `ReportIsland.tsx`, replace every layout occurrence:

```diff
- className="container mx-auto px-4 py-8"
+ className="site-container mx-auto px-4 py-8"
```

Keep all report-specific spacing, `space-y-*`, and fallback behavior unchanged.

- [ ] **Step 3: Run the focused contract and full verification**

Run each command:

```bash
npm test -- src/lib/siteContainerContract.test.ts
npm test
npm run lint
npm run build
```

Expected:

- the focused contract passes for all nine application surfaces;
- the full Vitest suite passes;
- lint exits 0;
- Astro check and static build exit 0 and generate `dist/index.html`.

- [ ] **Step 4: Verify source scope and generated output**

Run:

```bash
rg -n "class=\\\"container|className=\\\"container" src/pages src/components --glob '*.{astro,tsx}'
```

Expected: no matches in application layout surfaces. The `@container/card-header`
query in `src/components/ui/card.tsx` is allowed and must remain unchanged.

Inspect the generated page at `dist/index.html` and confirm the page still
contains the existing homepage H1 and the canonical link. The CSS bundle must
contain exactly one `.site-container` definition with `max-width:1200px`.

- [ ] **Step 5: Perform responsive browser verification**

Run the local Astro server on an available loopback port and inspect:

- homepage `/` at 1440px and 390px;
- `/reports` at 1440px and 390px;
- `/report/` loading fallback at 1440px and 390px.

At 1440px, the main content must be capped at 1200px with roughly 120px side
margins before existing horizontal padding. At 390px, content must remain within
the viewport with no horizontal scrollbar. Header, footer, tables, scanner,
report fallback, and existing internal reading widths must remain unchanged.

- [ ] **Step 6: Commit the React migration and verification contract**

Run:

```bash
git add src/lib/siteContainerContract.test.ts src/components/report/ReportView.tsx src/components/islands/ReportIsland.tsx
git commit -m "style: narrow report application containers"
```

Expected: one focused commit containing the React surface migration and final
contract coverage.
