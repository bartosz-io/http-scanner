# Server-Timing Diagram Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Server-Timing illustration clearly separate the request path from the timing breakdown so `db` cannot be mistaken for a Browser metric.

**Architecture:** Keep the guide as static semantic HTML rendered from Markdown and style it through the existing scoped Astro component. Introduce two labelled regions, CSS-only directional connectors, and one explicit marker for time that is absent from the displayed response field.

**Tech Stack:** Astro 7, Markdown content, scoped CSS, Vitest 4, JSDOM.

## Global Constraints

- Keep the existing static HTML and scoped CSS; add no client-side JavaScript or hydration.
- Preserve the current light card treatment and existing design tokens.
- Do not map Server-Timing metrics to request-path hops.
- Do not change the metric values or surrounding Server-Timing guide.
- Do not test explanatory sentence occurrences; test structural semantics and rendered behavior.

---

### Task 1: Separate the request path from the timing illustration

**Files:**
- Modify: `src/lib/headerContentContract.test.ts:1099-1113`
- Modify: `src/content/headers/server-timing.md:38-52`
- Modify: `src/components/astro/HeaderGuidePage.astro:223-323`

**Interfaces:**
- Consumes: the existing `figure[data-server-timing-timeline]` content contract.
- Produces: `[data-request-path]` and `[data-timing-illustration]` regions, plus one `[data-not-in-server-timing]` timing phase.

- [ ] **Step 1: Write the failing structural regression test**

Extend `assertTimelineSemantics` with DOM assertions that fail against the current flat figure:

```ts
const requestPath = timeline[0]?.querySelector('[data-request-path]');
const timingIllustration = timeline[0]?.querySelector('[data-timing-illustration]');

expect(requestPath).not.toBeNull();
expect(timingIllustration).not.toBeNull();
expect(requestPath?.querySelector('[data-timeline-path]')).not.toBeNull();
expect(requestPath?.querySelector('[data-timing-phase]')).toBeNull();
expect(timingIllustration?.querySelector('[data-timeline-path]')).toBeNull();
expect(timingIllustration?.querySelectorAll('[data-timing-phase]')).toHaveLength(3);
expect(timingIllustration?.querySelectorAll('[data-not-in-server-timing]')).toHaveLength(1);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts
```

Expected: FAIL because `[data-request-path]` and `[data-timing-illustration]` do not yet exist.

- [ ] **Step 3: Add the two semantic regions**

Replace the flat contents of the figure in `server-timing.md` with this structure while keeping the same values:

```html
<figure data-server-timing-timeline>
  <section data-request-path aria-labelledby="server-timing-request-path-label">
    <h3 id="server-timing-request-path-label" data-diagram-label>Request path</h3>
    <ol data-timeline-path aria-label="Illustrative request path">
      <li>Browser</li>
      <li>CDN</li>
      <li>Application</li>
      <li>Database</li>
    </ol>
  </section>
  <section data-timing-illustration aria-labelledby="server-timing-breakdown-label">
    <h3 id="server-timing-breakdown-label" data-diagram-label>Illustrative timing breakdown</h3>
    <p data-timing-total><strong>Browser-observed response wait</strong><span>128 ms</span></p>
    <dl data-timing-breakdown>
      <div data-timing-phase="db"><dt>db</dt><dd>53.2 ms</dd></div>
      <div data-timing-phase="app"><dt>app</dt><dd>41.8 ms</dd></div>
      <div data-timing-phase="unreported" data-not-in-server-timing><dt>Other response time</dt><dd>33 ms<small>Not sent in Server-Timing</small></dd></div>
    </dl>
    <p data-timing-field><code>Server-Timing: db;dur=53.2, app;dur=41.8</code></p>
  </section>
  <figcaption>This illustration uses deliberately non-overlapping spans. Real Server-Timing metrics can overlap or omit work, so arbitrary values cannot generally be subtracted from TTFB.</figcaption>
</figure>
```

- [ ] **Step 4: Style separation, direction, and the absent metric marker**

In `HeaderGuidePage.astro`:

- style `[data-diagram-label]` as a compact section label;
- add a top border and spacing to `[data-timing-illustration]`;
- increase the path grid gap and add `li:not(:last-child)::after` connectors with `content: '→'`;
- style `[data-not-in-server-timing]` and its `small` note distinctly but within the light theme;
- inside `@media (max-width: 640px)`, change connectors to `content: '↓'` and place them between stacked nodes.

Keep every selector below `[data-server-timing-timeline]` so other guide content is unaffected.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts src/lib/headerReferenceSeoContract.test.ts
```

Expected: both test files pass.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/lib/headerContentContract.test.ts src/content/headers/server-timing.md src/components/astro/HeaderGuidePage.astro
git commit -m "fix: clarify Server-Timing request diagram"
```

---

### Task 2: Verify responsive rendering and repository health

**Files:**
- Verify: `src/content/headers/server-timing.md`
- Verify: `src/components/astro/HeaderGuidePage.astro`

**Interfaces:**
- Consumes: the completed static diagram from Task 1.
- Produces: evidence that the diagram is readable at desktop and mobile widths without regressions.

- [ ] **Step 1: Run repository verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all tests and the production build pass; lint introduces no new errors or warnings.

- [ ] **Step 2: Inspect the page at desktop width**

Start the local site and open `/headers/server-timing/` at approximately `1440 × 1000`. Verify:

- `Request path` and `Illustrative timing breakdown` are visibly separate;
- arrows read left-to-right from Browser to Database;
- no timing segment appears vertically assigned to a request-path node;
- the `Other response time` segment states that it is not sent in `Server-Timing`.

- [ ] **Step 3: Inspect the page at mobile width**

Inspect the same route at approximately `390 × 844`. Verify the path stacks without horizontal overflow, arrows point downward, labels remain readable, and the timing cards do not clip.

- [ ] **Step 4: Review the final diff**

Run:

```bash
git diff HEAD~1 --check
git diff HEAD~1 -- src/lib/headerContentContract.test.ts src/content/headers/server-timing.md src/components/astro/HeaderGuidePage.astro
```

Expected: no whitespace errors and no unrelated changes.
