# Header Guide Code Block Rendering Design

Date: 2026-08-12
Status: approved in conversation; awaiting written-spec review

## 1. Goal

Make fenced code blocks rendered from header-guide Markdown visually consistent with the existing light `Syntax` and `Examples` cards on `/headers/[slug]/` pages.

The immediate defect is visible in the new HTTP examples on the `Access-Control-Allow-Origin` and `Access-Control-Max-Age` guides, but the fix must apply consistently to every fenced code block rendered inside `HeaderGuidePage.astro`.

## 2. Root cause

Astro renders an HTTP fenced Markdown block as `pre.astro-code` using Shiki's default `github-dark` theme. `HeaderGuidePage.astro` currently styles headings, paragraphs, and generic `code`, but does not style Markdown `pre` elements.

The resulting fenced block has:

- dark inline Shiki background and token colors;
- no padding, border, or corner radius;
- a 16 px font instead of the 14 px used by the page's code cards;
- no vertical separation from adjacent prose;
- `overflow-wrap: anywhere` inherited by its nested `code`, which can break protocol lines at arbitrary positions.

By contrast, the existing `Syntax` and `Examples` cards use a light muted background, a border, 10 px corner radius, 20 px padding, 14 px monospace text, and horizontal overflow.

## 3. Chosen approach

Add styles scoped to `.guide-markdown` in `HeaderGuidePage.astro`.

The styles will make Markdown fenced blocks match the existing light cards:

- light `var(--muted)`-based translucent background;
- `1px` border using `var(--border)`;
- `0.625rem` corner radius;
- `1.25rem` padding;
- `0.875rem` font size and the same compact line height as the existing cards;
- `1rem` top margin;
- `max-width: 100%` and `overflow-x: auto`;
- preserved whitespace and no arbitrary word wrapping.

Shiki's inline dark background and token colors will be neutralized only inside `.guide-markdown`. Fenced code will use the normal foreground color, matching the monochromatic `Syntax` and `Examples` cards.

## 4. Scope boundaries

In scope:

- fenced Markdown blocks rendered inside header guides;
- HTTP examples and any other fenced language used by those guides;
- desktop and narrow viewport behavior;
- light and dark application themes through existing design tokens.

Out of scope:

- changing Markdown source files or removing language identifiers;
- changing Astro's global Shiki configuration;
- changing inline-code styling in prose;
- changing code blocks outside `HeaderGuidePage.astro`;
- adding a copy button, filename label, language badge, or client-side component.

## 5. Testing and verification

Implementation will follow RED → GREEN TDD.

A focused source/rendering contract test will assert that `HeaderGuidePage.astro` contains the scoped fenced-block rules required for:

- light design-token background and foreground;
- padding, border, radius, font size, and top margin;
- horizontal overflow;
- removal of arbitrary wrapping from nested fenced code;
- scoped neutralization of Shiki inline presentation.

Verification will include:

- focused contract test;
- full test suite;
- ESLint;
- production build;
- `git diff --check`;
- browser screenshots at desktop and narrow viewport widths for at least one multi-line HTTP block;
- comparison against the existing `Syntax` and `Examples` cards on the same page.

## 6. Acceptance criteria

- Fenced HTTP blocks are light and visually consistent with `Syntax` and `Examples`.
- Blocks have visible spacing, padding, border, and rounded corners.
- Long protocol lines scroll horizontally instead of wrapping at arbitrary characters.
- Inline code in paragraphs is unchanged.
- Shiki no longer forces a dark block or colored tokens inside header-guide Markdown.
- No global Markdown or code-rendering behavior changes outside header guides.
- Tests, lint, and build complete without new errors or warnings.
