# All-header Value Overflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep long, unbroken HTTP header values inside the report width and expose horizontal scrolling within the value panel.

**Architecture:** Preserve the existing `AllHeaderCard` structure and formatting. Add width-containment utilities at the card, content, and value boundaries; protect that contract with a server-rendered component regression test and verify the resulting browser geometry.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, React DOM server rendering, Playwright CLI

## Global Constraints

- Do not use `break-all` for header values.
- Do not change API data, persistence, header formatting, filtering, or the security-analysis view.
- A long unbroken value must scroll inside its value panel without increasing document width.

---

### Task 1: Constrain and scroll long all-header values

**Files:**
- Create: `src/components/report/AllHeaderCard.test.tsx`
- Modify: `vitest.config.ts`
- Modify: `src/components/report/AllHeaderCard.tsx:10-30`

**Interfaces:**
- Consumes: `AllHeaderCardProps` and the existing `AllHeaderCard` component.
- Produces: unchanged `AllHeaderCard` component API with a width-containment presentation contract.

- [x] **Step 1: Enable the existing source alias in component tests**

Add the `@` alias used by application modules to `vitest.config.ts`:

```ts
alias: {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
},
```

- [x] **Step 2: Write the failing regression test**

Create `src/components/report/AllHeaderCard.test.tsx`:

```tsx
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AllHeaderCard } from './AllHeaderCard';

describe('AllHeaderCard', () => {
  it('contains a long unbroken value inside a horizontally scrollable panel', () => {
    const html = renderToStaticMarkup(
      <AllHeaderCard
        header={{
          name: 'report-to',
          displayName: 'Report-To',
          value: `https://example.com/${'a'.repeat(2048)}`,
          category: 'Other',
          summary: 'Reporting endpoint metadata.',
        }}
      />
    );

    expect(html).toMatch(/data-slot="card"[^>]*class="[^"]*min-w-0[^"]*max-w-full/);
    expect(html).toMatch(/data-slot="card-content"[^>]*class="[^"]*min-w-0[^"]*max-w-full/);
    expect(html).toMatch(/class="[^"]*w-full[^"]*max-w-full[^"]*overflow-x-auto/);
    expect(html).not.toContain('break-all">https://example.com/');
  });
});
```

- [x] **Step 3: Run the targeted test and confirm RED**

Run: `npm test -- src/components/report/AllHeaderCard.test.tsx`

Expected: FAIL because the rendered card does not contain `min-w-0`, `max-w-full`, and `w-full` at the required boundaries.

- [x] **Step 4: Implement the minimal containment fix**

Update only the three containment boundaries in `AllHeaderCard.tsx`:

```tsx
<Card className="min-w-0 max-w-full gap-4 border-slate-200 shadow-none">
  {/* existing header */}
  <CardContent className="min-w-0 max-w-full">
    <div className="w-full max-w-full overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
      {/* existing formatted value */}
    </div>
  </CardContent>
</Card>
```

- [x] **Step 5: Run the targeted test and confirm GREEN**

Run: `npm test -- src/components/report/AllHeaderCard.test.tsx`

Expected: PASS.

- [x] **Step 6: Run complete automated verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run lint`

Expected: zero errors; existing unrelated warnings may remain.

Run: `npm run build`

Expected: Astro and TypeScript checks pass and the production build completes.

- [x] **Step 7: Verify browser geometry**

Open a report containing a long, unbroken `Report-To` value. At desktop and narrow viewport widths verify:

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

For the value panel verify:

```js
valuePanel.scrollWidth > valuePanel.clientWidth
```

Expected: the document has no horizontal overflow and the value panel itself is horizontally scrollable.

- [x] **Step 8: Commit the fix**

```bash
git add vitest.config.ts src/components/report/AllHeaderCard.tsx src/components/report/AllHeaderCard.test.tsx docs/superpowers/plans/2026-07-31-all-header-value-overflow.md
git commit -m "fix: contain long response header values"
```
