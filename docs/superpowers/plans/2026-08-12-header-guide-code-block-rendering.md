# Header Guide Code Block Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make fenced Markdown code blocks in HTTP header guides render as the same light, padded, bordered cards used by the existing `Syntax` and `Examples` sections.

**Architecture:** Keep Astro's current Markdown and Shiki pipeline unchanged. Add presentation overrides scoped to `.guide-markdown` in `HeaderGuidePage.astro`, neutralizing Shiki's inline dark background and token colors only inside header guides while retaining fenced-code semantics and horizontal scrolling. Protect the visual contract with a source-level Vitest test and verify the generated page in a real browser at desktop and narrow viewport widths.

**Tech Stack:** Astro 7 Markdown rendering, Shiki-generated `pre.astro-code`, scoped Astro CSS, Tailwind design tokens, TypeScript, Vitest 4, ESLint, Astro static build, browser visual inspection.

## Global Constraints

- Match the existing light `Syntax` and `Examples` cards: light `var(--muted)`-based translucent background, `1px` border using `var(--border)`, `0.625rem` radius, `1.25rem` padding, `0.875rem` font size, and `1.25rem` line height.
- Apply the change only to fenced blocks inside `.guide-markdown` in `HeaderGuidePage.astro`.
- Preserve Astro's Markdown pipeline, fenced language identifiers, generated `pre.astro-code` markup, and static rendering.
- Neutralize Shiki's inline dark background and token colors inside header-guide fenced blocks.
- Preserve inline-code wrapping in prose while setting fenced `pre code` to `overflow-wrap: normal` and `word-break: normal`.
- Long code lines must remain on one logical line and use horizontal scrolling instead of arbitrary wrapping.
- Do not change Markdown content, global Shiki configuration, code blocks outside header guides, routes, client directives, or dependencies.
- Do not add copy controls, language badges, filenames, or interactive components.
- Preserve unrelated user changes and the six existing lint warnings; introduce no new warnings.
- Do not deploy without explicit user authorization.

## File Structure

- Modify `src/components/astro/HeaderGuidePage.astro`: add the scoped fenced-block presentation rules while preserving the existing inline-code rule.
- Modify `src/lib/headerReferenceSeoContract.test.ts`: add one focused source contract for the required selectors and declarations.

---

### Task 1: Align fenced Markdown blocks with the light code cards

**Files:**
- Modify: `src/lib/headerReferenceSeoContract.test.ts`
- Modify: `src/components/astro/HeaderGuidePage.astro`

**Interfaces:**
- Consumes: Astro's generated `pre.astro-code > code > span` markup, existing CSS variables `--muted`, `--border`, and `--foreground`, and the current `.guide-markdown` scope.
- Produces: a source-enforced visual contract for all fenced code blocks rendered by `HeaderGuidePage.astro`.

- [ ] **Step 1: Add the failing source contract**

Append this test inside `describe('HTTP header reference SEO contract', ...)` in `src/lib/headerReferenceSeoContract.test.ts`:

```ts
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
```

The final assertion protects the existing prose inline-code behavior. The later, more specific `pre code` rule will override it only for fenced blocks.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerReferenceSeoContract.test.ts -t "renders fenced guide code"
```

Expected: FAIL because `HeaderGuidePage.astro` does not contain the `pre.astro-code` selector or the required light-card declarations.

- [ ] **Step 3: Add the minimal scoped CSS implementation**

In the existing `<style>` block of `src/components/astro/HeaderGuidePage.astro`, keep the generic `.guide-markdown :global(code)` rule unchanged and append these rules immediately after it:

```css
  .guide-markdown :global(pre.astro-code) {
    margin-top: 1rem;
    max-width: 100%;
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 0.625rem;
    background-color: color-mix(
      in oklab,
      var(--muted) 30%,
      transparent
    ) !important;
    padding: 1.25rem;
    color: var(--foreground) !important;
    font-size: 0.875rem;
    line-height: 1.25rem;
    white-space: pre;
  }

  .guide-markdown :global(pre.astro-code span) {
    color: inherit !important;
  }

  .guide-markdown :global(pre code) {
    overflow-wrap: normal;
    word-break: normal;
  }
```

The `!important` declarations are intentional and narrowly scoped: Shiki emits its background and token colors as inline styles, so ordinary author styles cannot neutralize them.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npm test -- src/lib/headerReferenceSeoContract.test.ts -t "renders fenced guide code"
```

Expected: the focused test PASS with no warnings or failures.

- [ ] **Step 5: Run complete automated verification**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected:

- Vitest reports all test files and tests passing;
- ESLint exits successfully with no errors and only the same six known baseline warnings;
- Astro check reports zero errors, warnings, and hints;
- Astro builds 51 pages, including `/headers/access-control-allow-origin/` and `/headers/access-control-max-age/`;
- `git diff --check` prints no output.

- [ ] **Step 6: Verify generated markup and CSS scope**

Run:

```bash
rg -n 'pre class="astro-code github-dark"' dist/headers/access-control-allow-origin/index.html
rg -n 'pre\.astro-code|color-mix|overflow-wrap:normal|word-break:normal' dist/_astro/*.css
git diff -- src/components/astro/HeaderGuidePage.astro src/lib/headerReferenceSeoContract.test.ts
```

Expected:

- generated HTML still contains Shiki's semantic `pre.astro-code` output and the `http` language metadata;
- the generated component CSS contains the scoped light-card and no-wrap overrides;
- the source diff contains only the focused test and scoped component styles.

- [ ] **Step 7: Perform desktop browser verification**

Start the local site:

```bash
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:4321/headers/access-control-allow-origin/` using the Browser skill. Compare the first `.guide-markdown pre.astro-code` with `section[aria-labelledby="syntax"] pre` using computed styles.

Confirm these exact results for the fenced block:

```text
padding: 20px
border-width: 1px
border-radius: 10px
font-size: 14px
line-height: 20px
margin-top: 16px
overflow-x: auto
white-space: pre
nested code overflow-wrap: normal
nested code word-break: normal
```

Also confirm:

- the fenced block background equals the computed background of the existing `Syntax` card;
- a token `span` has the same computed color as its parent `pre`;
- inline paragraph code still has `overflow-wrap: anywhere`;
- the three-line credentials example has visible padding and rounded corners.

Capture a desktop screenshot to `/private/tmp/header-guide-code-block-desktop.png` for visual QA. Do not commit the screenshot.

- [ ] **Step 8: Perform narrow viewport verification**

Using the same local page, set a `390 × 844` viewport and inspect the three-line credentials example.

Confirm:

- no page-level horizontal overflow is introduced;
- the fenced block remains within its content column;
- long HTTP lines do not wrap at arbitrary characters;
- the fenced block itself scrolls horizontally when `scrollWidth > clientWidth`;
- padding, border, radius, and line height remain unchanged.

Capture a narrow screenshot to `/private/tmp/header-guide-code-block-mobile.png`, reset the temporary viewport override, and stop the development server. Do not commit the screenshot.

- [ ] **Step 9: Commit the verified fix**

Run:

```bash
git add src/components/astro/HeaderGuidePage.astro src/lib/headerReferenceSeoContract.test.ts
git commit -m "fix: align header guide code blocks"
```

Expected: one focused implementation commit containing only the component CSS and its contract test.

## Completion criteria

This plan is complete when the focused RED → GREEN cycle is documented, all automated verification is green, desktop and narrow browser checks satisfy the exact computed-style expectations, visual screenshots show parity with the light `Syntax` and `Examples` cards, the source diff is scoped to two files, and the fix is committed without an unauthorized deployment.
