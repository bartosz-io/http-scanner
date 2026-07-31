# Global Layout Width Design

**Date:** 2026-07-31
**Status:** Approved
**Scope:** Shared application layout width only

## Goal

Make the desktop layout of the entire HTTP Scanner application slightly more
compact while preserving the current mobile behavior, typography, spacing, and
page functionality.

## Selected Design

Introduce a project-owned Tailwind utility in `src/styles/global.css`:

```css
@utility site-container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
}
```

Replace the layout utility `container` with `site-container` in every full-width
application surface. Existing `mx-auto` and horizontal padding classes remain
unchanged. The new utility therefore changes only the desktop maximum width;
viewports below 1200px continue to use the available width with the existing
padding.

## Surfaces in scope

- `src/components/astro/SiteHeader.astro`
- `src/components/astro/SiteFooter.astro`
- `src/pages/index.astro`
- `src/components/astro/HomepageSeoContent.astro`
- `src/pages/reports.astro`
- `src/pages/report/index.astro`
- `src/pages/404.astro`
- `src/components/report/ReportView.tsx`
- `src/components/islands/ReportIsland.tsx`

The `@container/card-header` query in `src/components/ui/card.tsx` is a
component container query, not an application layout container, and must not be
changed.

## Non-goals

- Do not change font sizes, line heights, spacing, breakpoints, colors, or
  component behavior.
- Do not change scanner, report, API, or Worker logic.
- Do not change the internal `max-w-*` constraints that keep reading widths
  comfortable.
- Do not create a second layout system or duplicate width constants.

## Acceptance criteria

1. All in-scope application layout surfaces use `site-container`.
2. `site-container` has one definition with `max-width: 1200px`.
3. The component-query utility in `src/components/ui/card.tsx` remains
   untouched.
4. At a 1440px viewport, the main content width is 1200px, producing roughly
   120px side margins before horizontal padding.
5. At mobile widths, no horizontal overflow is introduced and existing page
   padding remains intact.
6. Homepage, reports, report loading fallback, report view, header, footer, and
   404 page render without regressions.

## Verification

- Add a focused source contract for the single utility definition and the
  in-scope class migration.
- Run the focused test and the full test suite.
- Run `npm run lint` and `npm run build`.
- Verify the generated static pages and inspect homepage, `/reports`, and
  `/report/` at desktop and mobile widths.
