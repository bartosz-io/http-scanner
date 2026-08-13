# Vary Guide Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore readable numbered steps and light, responsive Markdown tables in HTTP Header Reference guides.

**Architecture:** Keep Astro's existing semantic Markdown output and add reusable, component-scoped presentation rules under `.guide-markdown` in `HeaderGuidePage.astro`. Verify the user-visible behavior with real-browser computed styles at desktop and mobile widths; do not introduce a new content component or parser integration.

**Tech Stack:** Astro 7, Tailwind CSS 4 design tokens, semantic HTML, Playwright CLI, Vitest, ESLint

## Global Constraints

- Do not change the wording or protocol guidance in `src/content/headers/vary.md`.
- Do not change the Markdown/content engine or scan-report rendering.
- Keep lists and tables as semantic `<ol>`, `<ul>`, and `<table>` elements.
- Keep the presentation light and consistent with existing Header Reference code cards.
- Apply the styles through `.guide-markdown` so future reference guides inherit them.
- Tests and checks may assert structure or computed presentation behavior; they must not assert explanatory prose sentences.
- Do not add `@playwright/test` or another browser-test dependency; use the installed Playwright CLI wrapper for the regression check.

---

### Task 1: Restore Header Reference list and table presentation

**Files:**
- Modify: `src/components/astro/HeaderGuidePage.astro:146-190`
- Verify unchanged: `src/content/headers/vary.md`
- Test: browser-level computed-style check via Playwright CLI; no permanent browser test file

**Interfaces:**
- Consumes: semantic `<ol>`, `<ul>`, and `<table>` output rendered into the existing `.guide-markdown` slot
- Produces: reusable scoped list/table presentation without changing Markdown data or Astro component props

- [ ] **Step 1: Start the guide page locally and capture the failing presentation contract**

Run the development server in a persistent shell session:

```bash
npm run dev -- --host 127.0.0.1 --port 4322
```

In a separate shell, open the guide with the bundled Playwright CLI:

```bash
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting open http://127.0.0.1:4322/headers/vary/
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting resize 1440 1000
```

Run the presentation assertion before changing production code:

```bash
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting run-code "const ol = page.locator('.guide-markdown ol').first(); const table = page.locator('.guide-markdown table').first(); const th = table.locator('th').first(); const actual = { listStyleType: await ol.evaluate((element) => getComputedStyle(element).listStyleType), tableBorderTopWidth: await table.evaluate((element) => getComputedStyle(element).borderTopWidth), headerPaddingLeft: await th.evaluate((element) => getComputedStyle(element).paddingLeft) }; if (actual.listStyleType !== 'decimal' || actual.tableBorderTopWidth !== '1px' || actual.headerPaddingLeft !== '16px') throw new Error(JSON.stringify(actual));"
```

Expected: FAIL. The error reports `listStyleType` as `none`, with no intended table border or cell padding. This proves the check reproduces the screenshot defect.

- [ ] **Step 2: Add the minimal reusable list and table styles**

Extend the scoped `<style>` block in `src/components/astro/HeaderGuidePage.astro` immediately after the existing paragraph rule:

```css
  .guide-markdown :global(ol),
  .guide-markdown :global(ul) {
    margin-top: 1rem;
    padding-left: 1.5rem;
    color: var(--muted-foreground);
    line-height: 1.75rem;
  }

  .guide-markdown :global(ol) {
    list-style-type: decimal;
  }

  .guide-markdown :global(ul) {
    list-style-type: disc;
  }

  .guide-markdown :global(li + li) {
    margin-top: 0.5rem;
  }

  .guide-markdown :global(table) {
    width: 100%;
    margin-top: 1rem;
    overflow: hidden;
    border: 1px solid var(--border);
    border-spacing: 0;
    border-radius: 0.625rem;
    background-color: var(--card);
    table-layout: fixed;
    font-size: 0.875rem;
    line-height: 1.5rem;
  }

  .guide-markdown :global(thead) {
    background-color: color-mix(
      in oklab,
      var(--muted) 50%,
      transparent
    );
  }

  .guide-markdown :global(th),
  .guide-markdown :global(td) {
    padding: 0.75rem 1rem;
    overflow-wrap: anywhere;
    text-align: left;
    vertical-align: top;
  }

  .guide-markdown :global(th) {
    border-bottom: 1px solid var(--border);
    color: var(--foreground);
    font-weight: 600;
  }

  .guide-markdown :global(td) {
    color: var(--muted-foreground);
  }

  .guide-markdown :global(tbody tr:not(:last-child) td) {
    border-bottom: 1px solid var(--border);
  }

  @media (max-width: 640px) {
    .guide-markdown :global(table) {
      display: block;
      overflow-x: auto;
      table-layout: auto;
    }

    .guide-markdown :global(th),
    .guide-markdown :global(td) {
      min-width: 10rem;
    }
  }
```

Do not modify `vary.md` or add Vary-specific classes.

- [ ] **Step 3: Re-run the desktop presentation contract**

Reload the page and repeat the same assertion:

```bash
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting reload
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting run-code "const ol = page.locator('.guide-markdown ol').first(); const table = page.locator('.guide-markdown table').first(); const th = table.locator('th').first(); const actual = { listStyleType: await ol.evaluate((element) => getComputedStyle(element).listStyleType), tableBorderTopWidth: await table.evaluate((element) => getComputedStyle(element).borderTopWidth), headerPaddingLeft: await th.evaluate((element) => getComputedStyle(element).paddingLeft) }; if (actual.listStyleType !== 'decimal' || actual.tableBorderTopWidth !== '1px' || actual.headerPaddingLeft !== '16px') throw new Error(JSON.stringify(actual)); console.log(actual);"
```

Expected: PASS and output containing `decimal`, `1px`, and `16px`.

- [ ] **Step 4: Verify narrow-viewport containment and capture visual evidence**

```bash
mkdir -p output/playwright
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting screenshot --filename output/playwright/vary-formatting-desktop.png --full-page
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting resize 390 844
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting run-code "const table = page.locator('.guide-markdown table').first(); const actual = await table.evaluate((element) => ({ overflowX: getComputedStyle(element).overflowX, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })); if (actual.overflowX !== 'auto' || actual.scrollWidth <= actual.clientWidth) throw new Error(JSON.stringify(actual)); console.log(actual);"
/Users/bartosz/.codex/skills/playwright/scripts/playwright_cli.sh --session vary-formatting screenshot --filename output/playwright/vary-formatting-mobile.png --full-page
```

Expected: PASS. The mobile table has `overflow-x: auto` and a `scrollWidth` greater than its `clientWidth`. Inspect both screenshots and confirm numbered steps, visible table structure, readable wrapping, no page-level horizontal overflow, and consistency with the light code cards.

- [ ] **Step 5: Run repository verification**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
git diff --exit-code -- src/content/headers/vary.md
```

Expected:

- Vitest reports all test files and tests passing.
- ESLint exits `0`; the six pre-existing warnings may remain, but no errors or new warnings are introduced.
- Astro check reports `0 errors`, `0 warnings`, and `0 hints`; the production build emits all static pages.
- Both Git checks exit `0`, proving valid whitespace and unchanged Vary prose.

- [ ] **Step 6: Commit the formatting fix**

```bash
git add src/components/astro/HeaderGuidePage.astro
git commit -m "fix: style guide lists and tables"
```

Expected: one focused implementation commit containing only the reusable guide styles.
