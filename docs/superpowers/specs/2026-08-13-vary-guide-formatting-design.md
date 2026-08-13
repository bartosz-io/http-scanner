# Vary guide formatting design

**Date:** 2026-08-13

## Problem

The `Vary` reference guide contains a valid ordered list and two valid Markdown tables, but the rendered page does not restore the browser styles removed by Tailwind's base reset. The list therefore appears as unnumbered lines, while table headers and cells have no padding, separators, or visual container.

The Markdown output is structurally correct: Astro emits semantic `<ol>` and `<table>` elements. The defect is limited to presentation inside `HeaderGuidePage.astro`.

## Scope

Apply reusable styles to semantic lists and tables inside `.guide-markdown`.

The change must:

- restore visible numbering and readable vertical spacing for ordered lists;
- preserve semantic list and table markup;
- render tables as light, bordered reference cards consistent with existing light code examples;
- distinguish table headers with a subtle muted background and stronger text;
- add cell padding and row separators;
- keep long technical values readable and allow horizontal table scrolling on narrow viewports;
- apply to future Header Reference Markdown content, not only the `Vary` page.

The change must not:

- alter the wording or protocol guidance in `vary.md`;
- introduce custom table data or Vary-specific presentation components;
- change the Markdown/content engine;
- change scan-report rendering.

## Design

Extend the scoped `<style>` block in `HeaderGuidePage.astro` with `.guide-markdown :global(...)` selectors.

Ordered lists will use decimal markers, left padding, top spacing, readable line height, muted body text, and spacing between items. Unordered-list support will follow the same typography with disc markers so future Markdown lists render consistently.

Tables will remain native semantic tables. The table itself will provide a full-width, horizontally scrollable, rounded bordered surface. Header and data cells will receive consistent alignment and padding. The header row will use the existing muted color token; body rows will use border separators. Inline code will continue to use the existing guide styling and may wrap where necessary.

No new React or Astro component is required.

## Verification

Use a browser-level computed-style regression check against the rendered guide:

- before the fix, confirm the ordered list has `list-style-type: none` and the table lacks the intended border/cell spacing;
- after the fix, confirm decimal markers, cell padding, table border/background, and narrow-viewport horizontal containment;
- visually inspect the `Vary` section at desktop and mobile widths;
- run the full test suite, lint, and production build.

Tests must assert structural or computed presentation behavior. They must not assert explanatory prose sentences.
