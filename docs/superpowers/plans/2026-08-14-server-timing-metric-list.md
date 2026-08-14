# Server-Timing Metric List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the misleading Server-Timing breakdown visualization with a semantic metric definition list that cannot be read as a timeline or request-path mapping.

**Architecture:** Keep the request path as the figure's only directional visualization. Replace the lower timing region with static documentation markup containing the actual response field, a short order disclaimer, and a two-entry definition list; remove all proportional timing CSS and update the surrounding explanation.

**Tech Stack:** Astro 7, Markdown content, scoped CSS, Vitest 4, JSDOM, Playwright CLI.

## Global Constraints

- Preserve the current static request-path markup and desktop/mobile arrows.
- Use `What Server-Timing publishes` as the lower section label.
- Show `Server-Timing: db;dur=53.2, app;dur=41.8` before the metric definitions.
- Render exactly two definitions: `db` with `53.2 ms`, and `app` with `41.8 ms`.
- Remove `128 ms`, `33 ms`, `Other response time`, `Not sent in Server-Timing`, and `Illustrative timing breakdown` from the figure.
- Do not use cards, bars, proportional widths, arrows, or request-path alignment for the metric definitions.
- Keep the implementation static: no client-side JavaScript or hydration.
- Keep new CSS scoped below `[data-server-timing-timeline]` and reuse existing design tokens.
- Do not assert explanatory sentence occurrences; test structural semantics and rendered behavior.

---

### Task 1: Replace the timing breakdown with semantic metric definitions

**Files:**
- Modify: `src/lib/headerContentContract.test.ts:1099-1142`
- Modify: `src/lib/headerReferenceSeoContract.test.ts:76-99`
- Modify: `src/content/headers/server-timing.md:38-67`
- Modify: `src/components/astro/HeaderGuidePage.astro:223-373`

**Interfaces:**
- Consumes: `figure[data-server-timing-timeline]` and its existing labelled request-path region.
- Produces: one labelled `[data-server-timing-publication]` region containing `[data-timing-field]`, `[data-metric-order-note]`, and `dl[data-published-metrics]` with exactly two `[data-published-metric]` children.

- [ ] **Step 1: Write the failing DOM contract**

Replace the timing-illustration assertions inside `assertTimelineSemantics` with structural expectations for the publication region:

```ts
const publication = timeline[0]?.querySelector(
  '[data-server-timing-publication]'
);

expect(publication).not.toBeNull();
assertRegionLabel(publication);
expect(requestPath?.querySelector('[data-published-metrics]')).toBeNull();
expect(publication?.querySelector('[data-timeline-path]')).toBeNull();
const timingField = publication?.querySelector('[data-timing-field]');
expect(timingField).not.toBeNull();
expect(publication?.querySelector('[data-metric-order-note]')).not.toBeNull();
const publishedMetrics = publication?.querySelector(
  'dl[data-published-metrics]'
);
expect(publishedMetrics).not.toBeNull();
if (!timingField || !publishedMetrics) {
  throw new Error('Expected the response field and metric definitions');
}
expect(
  publishedMetrics?.querySelectorAll(':scope > [data-published-metric]')
).toHaveLength(2);
const metricDefinitions = Array.from(publishedMetrics?.querySelectorAll(
  ':scope > [data-published-metric]'
) ?? []);
for (const metric of metricDefinitions) {
  expect(metric.querySelector('dt')).not.toBeNull();
  expect(metric.querySelector('dd')).not.toBeNull();
}
expect(
  metricDefinitions.map((metric) => ({
    name: metric.querySelector('dt code')?.textContent,
    duration: metric.querySelector('dd code')?.textContent,
  }))
).toEqual([
  { name: 'db', duration: '53.2 ms' },
  { name: 'app', duration: '41.8 ms' },
]);
expect(
  timingField.compareDocumentPosition(publishedMetrics) &
    dom.window.Node.DOCUMENT_POSITION_FOLLOWING
).toBe(dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
expect(timeline[0]?.querySelector('[data-timing-total]')).toBeNull();
expect(timeline[0]?.querySelector('[data-timing-breakdown]')).toBeNull();
expect(timeline[0]?.querySelector('[data-timing-phase]')).toBeNull();
expect(timeline[0]?.querySelector('[data-not-in-server-timing]')).toBeNull();
```

Retain the existing checks for one figure, one caption, four request-path nodes, labelled regions, and no script.

- [ ] **Step 2: Write the failing scoped-style contract**

Update `headerReferenceSeoContract.test.ts` to require selectors for:

```ts
'.guide-markdown :global([data-server-timing-timeline] [data-server-timing-publication])'
'.guide-markdown :global([data-server-timing-timeline] [data-published-metrics])'
'.guide-markdown :global([data-server-timing-timeline] [data-published-metric])'
```

Also require the component source not to contain these removed selectors:

```ts
'[data-timing-total]'
'[data-timing-breakdown]'
'[data-timing-phase]'
'[data-not-in-server-timing]'
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts src/lib/headerReferenceSeoContract.test.ts
```

Expected: FAIL because the publication region and metric-list selectors do not exist, while the removed timing structures still do.

- [ ] **Step 4: Replace the lower figure markup**

Keep the request-path section unchanged and replace the lower section with:

```html
<section data-server-timing-publication aria-labelledby="server-timing-publication-label">
  <h3 id="server-timing-publication-label" data-diagram-label>What Server-Timing publishes</h3>
  <p data-timing-field><code>Server-Timing: db;dur=53.2, app;dur=41.8</code></p>
  <p data-metric-order-note>These are named metrics, not request-path steps. Field order does not represent execution order.</p>
  <dl data-published-metrics>
    <div data-published-metric><dt><code>db</code></dt><dd>Duration: <code>53.2 ms</code></dd></div>
    <div data-published-metric><dt><code>app</code></dt><dd>Duration: <code>41.8 ms</code></dd></div>
  </dl>
</section>
```

Replace the caption with a concise explanation that the definitions are not a timeline or decomposition of browser wait and that real metrics may overlap or omit work.

- [ ] **Step 5: Update the adjacent guide explanation**

Rewrite the two paragraphs immediately after the figure so they:

- explain that the browser observes the whole request path while the response publishes selected named metrics;
- state that serialized field order does not establish which metric started first;
- retain that metrics may overlap, nest, be partial, omit work, and have no standard per-metric `startTime`;
- contain no reference to illustrated spans "above", `128 ms`, or a derived remainder.

- [ ] **Step 6: Replace timing-grid CSS with list CSS**

In `HeaderGuidePage.astro`:

- rename the lower-region selector to `[data-server-timing-publication]` while retaining its divider and spacing;
- keep `[data-timing-field]` as a light code field and place it first in the section;
- add muted paragraph styling for `[data-metric-order-note]`;
- render `[data-published-metrics]` as an ordinary definition list with no proportional grid;
- render each `[data-published-metric]` as a simple two-column row separated by a border, without a surrounding card;
- scope `dt` and `dd` styling to `[data-published-metrics]`;
- at `max-width: 640px`, stack each definition row into one column;
- delete all CSS for timing total, breakdown phases, and the unreported marker.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts src/lib/headerReferenceSeoContract.test.ts
```

Expected: both files pass with no test output warnings.

- [ ] **Step 8: Run the full suite and commit**

Run:

```bash
npm test
```

Expected: all repository tests pass.

Commit:

```bash
git add src/lib/headerContentContract.test.ts src/lib/headerReferenceSeoContract.test.ts src/content/headers/server-timing.md src/components/astro/HeaderGuidePage.astro
git commit -m "fix: replace Server-Timing breakdown with metric list"
```

---

### Task 2: Verify documentation rendering and repository health

**Files:**
- Verify: `src/content/headers/server-timing.md`
- Verify: `src/components/astro/HeaderGuidePage.astro`

**Interfaces:**
- Consumes: the publication region and definition-list styling from Task 1.
- Produces: evidence that the final page is unambiguous, responsive, and production-buildable.

- [ ] **Step 1: Run repository checks**

Run:

```bash
npm run lint
npm run build
```

Expected: lint has zero errors and no new warnings; Astro and TypeScript checks have zero errors; the static build completes.

- [ ] **Step 2: Inspect desktop rendering**

Start the local site and inspect `/headers/server-timing/` at approximately `1440 × 1000`. Confirm:

- arrows and directional flow appear only in `Request path`;
- `What Server-Timing publishes` reads as ordinary documentation below a divider;
- the header field appears before the definitions;
- `db` and `app` are plain definition rows without boxes, bars, proportional widths, or alignment to request-path nodes;
- no `128 ms`, `33 ms`, `Other response time`, or `Not sent in Server-Timing` remains in the figure.

- [ ] **Step 3: Inspect mobile rendering**

Inspect the same route at approximately `390 × 844`. Confirm the request path retains downward arrows, each metric definition stacks naturally, all code remains readable, and the document has no horizontal overflow.

- [ ] **Step 4: Review the final diff**

Run:

```bash
git diff HEAD~1 --check
git diff HEAD~1 -- src/lib/headerContentContract.test.ts src/lib/headerReferenceSeoContract.test.ts src/content/headers/server-timing.md src/components/astro/HeaderGuidePage.astro
```

Expected: no whitespace errors, no unrelated changes, and no production references to the removed timing-breakdown selectors.
