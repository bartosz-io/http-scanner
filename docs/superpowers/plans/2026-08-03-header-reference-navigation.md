# Header Reference Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the HTTP Header Reference as a first-class primary-navigation destination while keeping the header usable on narrow screens.

**Architecture:** Keep navigation as static, server-rendered Astro markup in the existing shared `SiteHeader.astro`. Use responsive utility classes to switch between concise and descriptive labels and to hide the lower-priority Reports link only below the `sm` breakpoint; no JavaScript or new component is needed.

**Tech Stack:** Astro 7, Tailwind CSS 4 utilities, Vitest contract tests, Playwright manual verification

## Global Constraints

- The reference destination is the direct canonical path `/headers/`.
- Desktop destinations are `Security Scanner`, `HTTP Headers`, `Header Reference`, and `Reports`.
- Narrow-screen labels are `Security`, `Headers`, and `Reference`; `Reports` is hidden below the `sm` breakpoint.
- The header remains server-rendered, keyboard-accessible, and functional without JavaScript.
- Do not introduce a dropdown, mobile menu, route, or dependency.

---

## File Structure

- Modify `src/components/astro/SiteHeader.astro`: render the revised primary navigation and responsive labels.
- Modify `src/lib/httpHeadersCheckerSeoContract.test.ts`: protect the reference link, labels, and narrow-screen behavior with source-contract assertions.

### Task 1: Promote Header Reference in primary navigation

**Files:**
- Modify: `src/lib/httpHeadersCheckerSeoContract.test.ts:64-83`
- Modify: `src/components/astro/SiteHeader.astro:12-30`

**Interfaces:**
- Consumes: the existing shared `SiteHeader.astro`, Astro-rendered links, and Tailwind responsive prefixes.
- Produces: a direct `<a href="/headers/">` primary-navigation link and responsive labels covered by the existing Vitest contract suite.

- [x] **Step 1: Write the failing navigation contract assertions**

Extend the discovery test with the header-reference destination and replace the old narrow-width assertion with explicit responsive requirements:

```ts
expect(siteHeaderSource).toContain('href="/headers/"');
expect(siteHeaderSource).toContain('Header Reference');

expect(siteHeaderSource).toContain(
  '<span class="md:hidden">Security</span>'
);
expect(siteHeaderSource).toContain(
  '<span class="hidden md:inline">Security Scanner</span>'
);
expect(siteHeaderSource).toContain(
  '<span class="md:hidden">Headers</span>'
);
expect(siteHeaderSource).toContain(
  '<span class="hidden md:inline">HTTP Headers</span>'
);
expect(siteHeaderSource).toContain(
  '<span class="md:hidden">Reference</span>'
);
expect(siteHeaderSource).toContain(
  '<span class="hidden md:inline">Header Reference</span>'
);
expect(siteHeaderSource).toContain('<li class="hidden sm:block">');
expect(siteHeaderSource.match(/px-2 text-sm sm:px-4/g)).toHaveLength(4);
```

Keep the existing assertion that hides the wordmark below `sm`.

- [x] **Step 2: Run the targeted test and verify the new contract fails**

Run:

```bash
npm test -- src/lib/httpHeadersCheckerSeoContract.test.ts
```

Expected: FAIL because `SiteHeader.astro` has no `/headers/` link or responsive navigation-label spans and currently contains only three navigation links.

- [x] **Step 3: Implement the minimal server-rendered navigation markup**

In `SiteHeader.astro`, keep the existing logo and navigation containers. Replace `Home` with responsive `Security`/`Security Scanner` spans, replace the visible HTTP Headers text with responsive `Headers`/`HTTP Headers` spans, add the direct reference link, and hide the Reports list item below `sm`:

```astro
<li>
  <a href="/" class="inline-flex h-9 items-center rounded-md px-2 text-sm sm:px-4 font-medium hover:bg-accent hover:text-accent-foreground">
    <span class="md:hidden">Security</span>
    <span class="hidden md:inline">Security Scanner</span>
  </a>
</li>
<li>
  <a href="/http-headers-checker/" class="inline-flex h-9 items-center rounded-md px-2 text-sm sm:px-4 font-medium hover:bg-accent hover:text-accent-foreground">
    <span class="md:hidden">Headers</span>
    <span class="hidden md:inline">HTTP Headers</span>
  </a>
</li>
<li>
  <a href="/headers/" class="inline-flex h-9 items-center rounded-md px-2 text-sm sm:px-4 font-medium hover:bg-accent hover:text-accent-foreground">
    <span class="md:hidden">Reference</span>
    <span class="hidden md:inline">Header Reference</span>
  </a>
</li>
<li class="hidden sm:block">
  <a href="/reports" class="inline-flex h-9 items-center rounded-md px-2 text-sm sm:px-4 font-medium hover:bg-accent hover:text-accent-foreground">
    Reports
  </a>
</li>
```

- [x] **Step 4: Run the targeted test and verify it passes**

Run:

```bash
npm test -- src/lib/httpHeadersCheckerSeoContract.test.ts
```

Expected: all tests in `httpHeadersCheckerSeoContract.test.ts` PASS.

- [x] **Step 5: Run static verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit with status 0 and the Astro build includes `/headers/index.html`.

- [x] **Step 6: Verify desktop and narrow layouts in a real browser**

Start the local site with `npm run dev:web`. Inspect `/` at 1280 px and 320 px viewport widths.

Expected at 1280 px: the header shows `Security Scanner`, `HTTP Headers`, `Header Reference`, and `Reports` without overlap.

Expected at 320 px: the wordmark and Reports link are hidden; `Security`, `Headers`, and `Reference` remain visible without horizontal overflow. Tab through the links and verify each receives keyboard focus and opens its intended route.

- [x] **Step 7: Commit the implementation**

```bash
git add docs/superpowers/plans/2026-08-03-header-reference-navigation.md src/components/astro/SiteHeader.astro src/lib/httpHeadersCheckerSeoContract.test.ts
git commit -m "feat: add header reference to primary navigation"
```
