# Server-Timing SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `/headers/server-timing/` into a debugging-first guide with a semantic request timeline, browser and server implementation examples, cross-origin diagnostics, and production-safe measurement guidance.

**Architecture:** Keep the route and Astro content model unchanged. Extend the existing Markdown guide, render one static raw-HTML `<figure>` through the shared guide renderer, and add narrowly scoped styles keyed by `data-server-timing-timeline`. Protect structure, examples, links, and rendering with MDAST- and source-level contracts while reviewing explanatory correctness independently against W3C, Node.js, and Cloudflare documentation.

**Tech Stack:** Astro 7 content collections, Markdown/MDAST via `satteri`, TypeScript 5.7, Vitest 4, JSDOM, Node.js Performance APIs, Cloudflare Workers Web APIs, CSS design tokens.

## Global Constraints

- Preserve `/headers/server-timing/`, its canonical URL, generated title pattern, content collection, scanner, report engine, analytics events, and dependencies.
- Do not convert the guide to MDX or add client-side hydration, an interactive profiler, a RUM collector, OpenTelemetry integration, charting, or a framework cookbook.
- Keep Express and Cloudflare Workers as bounded examples inside one guide; they are not new application subsystems.
- Treat milliseconds as the guide's emission convention and the specification's recommendation, not as an enforceable property of every wire value.
- Never imply that arbitrary Server-Timing metrics are exhaustive, trusted, non-overlapping, origin-generated, or directly subtractable from TTFB.
- Keep DevTools visibility, Performance API visibility, `Timing-Allow-Origin`, CORS, content access, authentication, and authorization distinct.
- The Worker example must measure awaited I/O, preserve response streaming, use an explicit upstream host, and reject production CPU-duration interpretation.
- The timeline must be static semantic HTML, readable without CSS, text-labeled, responsive at 320px, and styled with existing light design tokens.
- Do not test complete explanatory sentences or fixed prose fragments. Use AST structure, code parsing, link destinations, rendered metadata, and independent technical review.
- Do not deploy, submit to GSC, or claim SEO uplift during implementation.

---

## File Map

- Modify `src/content/headers/server-timing.md`: frontmatter, approved guide sections, semantic timeline, examples, diagnostics, privacy guidance, and contextual links.
- Modify `src/lib/headerContentContract.test.ts`: reusable MDAST collection for code, raw HTML, and tables; Server-Timing structural and code-example contract.
- Modify `src/components/astro/HeaderGuidePage.astro`: narrowly scoped timeline styles only.
- Modify `src/lib/headerReferenceSeoContract.test.ts`: timeline style scoping and no-hydration contract.
- Modify `SEO_PLAN.md`: change Server-Timing from `NEXT` to `DONE` only after all verification gates pass; add exact implementation commits and an awaiting-deployment observation row.
- Modify `docs/superpowers/plans/2026-08-14-server-timing-seo.md`: check steps only after their commands or reviews succeed.

## Task 1: Build the guide and its structural content contract

**Files:**
- Modify: `src/lib/headerContentContract.test.ts:150-220`
- Modify: `src/lib/headerContentContract.test.ts` after the Vary contract
- Modify: `src/content/headers/server-timing.md`

**Interfaces:**
- Consumes: `markdownToMdast(source)` and the existing frontmatter/heading helpers in `headerContentContract.test.ts`.
- Produces: `collectMarkdownContractNodes(source)` fields `codeBlocks`, `htmlBlocks`, and `tables`, plus a complete Server-Timing Markdown source that Task 2 styles without changing its structure.

- [ ] **Step 1: Extend the MDAST collector with structural node data**

Add these contract types next to `MarkdownParagraphContractNode`:

```ts
type MarkdownCodeBlockContractNode = MarkdownContractNode & {
  lang: string | null;
  value: string;
};

type MarkdownTableContractNode = MarkdownContractNode & {
  columnCount: number;
  rowCount: number;
};
```

Change the collector return type to include:

```ts
codeBlocks: MarkdownCodeBlockContractNode[];
htmlBlocks: string[];
tables: MarkdownTableContractNode[];
```

Initialize all three arrays. During the existing tree visit:

```ts
if (
  node.type === 'code' &&
  'value' in node &&
  typeof node.value === 'string'
) {
  const lang = 'lang' in node && typeof node.lang === 'string'
    ? node.lang
    : null;

  codeBlocks.push({
    ...contractNode,
    lang,
    value: node.value,
  });

  if (lang === 'http') {
    httpCodeBlocks.push(node.value);
  }
} else if (
  node.type === 'html' &&
  'value' in node &&
  typeof node.value === 'string'
) {
  htmlBlocks.push(node.value);
} else if (node.type === 'table' && 'children' in node) {
  const rows = node.children.filter((child) => child.type === 'tableRow');
  const firstRow = rows[0];
  const columnCount = firstRow && 'children' in firstRow
    ? firstRow.children.filter((child) => child.type === 'tableCell').length
    : 0;

  tables.push({
    ...contractNode,
    columnCount,
    rowCount: rows.length,
  });
}
```

Remove the old `else if` branch that separately pushes HTTP code so each code node is collected once. Return the new arrays with the existing fields.

- [ ] **Step 2: Add imports for structural HTML and code parsing**

At the top of `headerContentContract.test.ts`, add:

```ts
import { JSDOM } from 'jsdom';
import ts from 'typescript';
```

Add this helper below `collectMarkdownContractNodes`:

```ts
function expectParseableScript(source: string, scriptKind: ts.ScriptKind): void {
  const file = ts.createSourceFile(
    'guide-example.ts',
    source,
    ts.ScriptTarget.ESNext,
    true,
    scriptKind
  );

  expect(file.parseDiagnostics).toEqual([]);
}
```

- [ ] **Step 3: Write the failing Server-Timing structural contract**

Add a test after the Vary contract. It must read `src/content/headers/server-timing.md` and assert the exact H2 architecture structurally:

```ts
const expectedH2Headings = [
  '## Meaning and behavior',
  '## Implementation notes',
  '## Where Server-Timing fits in a request',
  '## Server-Timing syntax: names, dur, and desc',
  '## Inspect Server-Timing in browser DevTools',
  '## Read Server-Timing from JavaScript',
  '## Add Server-Timing in Express',
  '## Add Server-Timing in a Cloudflare Worker',
  '## Cross-origin metrics and Timing-Allow-Origin',
  '## Debug missing or misleading Server-Timing metrics',
  '## Design production metrics without leaking internals',
];

expect(
  contract.h2Headings.map(({ text }) => `## ${text}`)
).toEqual(expectedH2Headings);
```

Assert frontmatter structurally:

```ts
expect(parseFrontmatterList(frontmatter ?? '', 'relatedHeaders')).toEqual([
  'timing-allow-origin',
  'x-runtime',
  'cache-control',
]);
```

Parse raw HTML and assert semantics without comparing prose:

```ts
const dom = new JSDOM(contract.htmlBlocks.join('\n'));
const timeline = dom.window.document.querySelectorAll(
  'figure[data-server-timing-timeline]'
);

expect(timeline).toHaveLength(1);
expect(timeline[0]?.querySelectorAll('figcaption')).toHaveLength(1);
expect(timeline[0]?.querySelectorAll('[data-timeline-path] > li')).toHaveLength(4);
expect(timeline[0]?.querySelectorAll('[data-timing-phase]')).toHaveLength(3);
expect(timeline[0]?.querySelector('[data-timing-total]')).not.toBeNull();
expect(timeline[0]?.querySelector('script')).toBeNull();
```

Assert code-block structure:

```ts
const javascriptBlocks = contract.codeBlocks.filter(({ lang }) => lang === 'js');
const typescriptBlocks = contract.codeBlocks.filter(({ lang }) => lang === 'ts');
const httpBlocks = contract.codeBlocks.filter(({ lang }) => lang === 'http');

expect(javascriptBlocks).toHaveLength(2);
expect(typescriptBlocks).toHaveLength(1);
expect(httpBlocks.length).toBeGreaterThanOrEqual(5);

for (const block of javascriptBlocks) {
  expectParseableScript(block.value, ts.ScriptKind.JS);
}
expectParseableScript(typescriptBlocks[0]?.value ?? '', ts.ScriptKind.TS);
```

Bind implementation safety through code structure rather than explanatory sentences:

```ts
const workerExample = typescriptBlocks[0]?.value ?? '';
expect(workerExample).toMatch(/await fetch\(new Request\(upstreamUrl, request\)\)/);
expect(workerExample).toMatch(/new Response\(upstreamResponse\.body,/);
expect(workerExample).not.toMatch(/upstreamResponse\.(text|json|arrayBuffer|blob)\(/);

const expressExample = javascriptBlocks.find(({ value }) =>
  value.includes("app.get('/products'")
)?.value ?? '';
expect(expressExample).toContain("response.setHeader(\n    'Server-Timing'");
expect(expressExample.indexOf('response.setHeader')).toBeLessThan(
  expressExample.indexOf("response.type('application/json').send(body)")
);
```

Assert the troubleshooting table shape and contextual links:

```ts
expect(
  contract.tables.some(({ columnCount, rowCount }) =>
    columnCount === 3 && rowCount >= 9
  )
).toBe(true);

expect(contract.linkDestinations).toEqual(
  expect.arrayContaining([
    '/headers/timing-allow-origin/',
    '/headers/x-runtime/',
    '/headers/cache-control/',
  ])
);
```

Add mutation checks for duplicate/unexpected headings, a missing figcaption, a buffered Worker body, and a removed contextual link. Do not add `source.toContain()` assertions for explanatory claims.

- [ ] **Step 4: Run the focused test to prove RED**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts
```

Expected: FAIL in the new Server-Timing test because the existing guide lacks the approved H2 sequence, figure, code blocks, troubleshooting table, and contextual links. Existing contracts must remain green.

- [ ] **Step 5: Update Server-Timing frontmatter and foundations**

Keep `headerName`, applicability, use cases, common mistakes, security considerations, related headers, and references. Replace the description with a value between 80 and 180 characters conveying this exact scope:

```yaml
description: Learn how Server-Timing exposes selected backend metrics in DevTools and the Performance API, with syntax, implementation, and debugging examples.
```

Keep the first example and add:

```yaml
  - 'Server-Timing: cache;desc="Cache hit", db;dur=53.2, app;dur=41.8'
```

Revise the two foundation sections so they establish these boundaries without duplicating later sections:

- the field carries named metrics selected by a server or intermediary;
- `dur` and `desc` are optional;
- the guide emits recommended millisecond values but the wire format does not enforce a unit;
- metrics are not a complete trace, trusted total, access-control signal, or guaranteed origin measurement;
- public metric names, descriptions, and precision need privacy review.

- [ ] **Step 6: Add the semantic timeline and syntax section**

Append `## Where Server-Timing fits in a request` with this raw HTML structure:

```html
<figure data-server-timing-timeline>
  <ol data-timeline-path aria-label="Illustrative request path">
    <li>Browser</li>
    <li>CDN</li>
    <li>Application</li>
    <li>Database</li>
  </ol>
  <p data-timing-total><strong>Browser-observed response wait</strong><span>128 ms</span></p>
  <dl data-timing-breakdown>
    <div data-timing-phase="db"><dt>db</dt><dd>53.2 ms</dd></div>
    <div data-timing-phase="app"><dt>app</dt><dd>41.8 ms</dd></div>
    <div data-timing-phase="unreported"><dt>unreported</dt><dd>33 ms</dd></div>
  </dl>
  <p data-timing-field><code>Server-Timing: db;dur=53.2, app;dur=41.8</code></p>
  <figcaption>This illustration uses deliberately non-overlapping spans. Real Server-Timing metrics can overlap or omit work, so arbitrary values cannot generally be subtracted from TTFB.</figcaption>
</figure>
```

Use the figcaption exactly as reader-facing copy shown above. Add the explanatory paragraphs from spec sections 6.1 and 6.2, then add the exact heading `## Server-Timing syntax: names, dur, and desc` and these fenced HTTP examples:

```http
Server-Timing: cache
```

```http
Server-Timing: db;dur=53.2
```

```http
Server-Timing: app;dur=41.8;desc="Application"
```

```http
Server-Timing: db;dur=53.2, app;dur=41.8;desc="Application"
```

Cover metric-name requirements, optional parameters, invalid/missing `dur`, missing `desc`, quoted descriptions, repeated metric names, repeated parameters, unknown parameters, non-semantic metric order, the absent standardized start time, and a bounded trailer note.

- [ ] **Step 7: Add DevTools and browser API sections**

Add the exact headings `## Inspect Server-Timing in browser DevTools` and `## Read Server-Timing from JavaScript`.

The DevTools section must use the ordered diagnostic flow from spec section 6.3 and avoid browser-specific tab promises.

Use this exact JavaScript code block:

```js
for (const entryType of ['navigation', 'resource']) {
  for (const entry of performance.getEntriesByType(entryType)) {
    for (const metric of entry.serverTiming) {
      console.log({
        url: entry.name,
        name: metric.name,
        duration: metric.duration,
        description: metric.description,
      });
    }
  }
}
```

Explain frozen arrays, navigation and resource entries, zero-duration ambiguity, entry-buffer timing, URL selection, and the later cross-origin boundary. Do not add analytics transmission code.

- [ ] **Step 8: Add Express and Worker implementation sections**

Add `## Add Server-Timing in Express` with the exact dependency-free code from spec section 6.5:

```js
import { performance } from 'node:perf_hooks';

app.get('/products', async (request, response) => {
  const dbStart = performance.now();
  const products = await loadProducts();
  const dbDuration = performance.now() - dbStart;

  const appStart = performance.now();
  const body = JSON.stringify({ products });
  const appDuration = performance.now() - appStart;

  response.setHeader(
    'Server-Timing',
    `db;dur=${dbDuration.toFixed(1)}, app;dur=${appDuration.toFixed(1)}`,
  );
  response.type('application/json').send(body);
});
```

Define excluded phases and the response-commit boundary. Do not interpolate user-controlled descriptions or present a finish hook as a normal-header solution.

Add `## Add Server-Timing in a Cloudflare Worker` with this exact streaming proxy example:

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    const incomingUrl = new URL(request.url);
    const upstreamUrl = new URL(
      `${incomingUrl.pathname}${incomingUrl.search}`,
      'https://origin.example',
    );

    const upstreamStart = performance.now();
    const upstreamResponse = await fetch(new Request(upstreamUrl, request));
    const upstreamDuration = performance.now() - upstreamStart;

    const headers = new Headers(upstreamResponse.headers);
    headers.append(
      'Server-Timing',
      `upstream;dur=${upstreamDuration.toFixed(1)}`,
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
```

Explain I/O-only scope, explicit upstream routing, frozen production CPU timers, local-development differences, intermediary field ownership, streaming, and private Worker observability.

- [ ] **Step 9: Add TAO, troubleshooting, privacy, and contextual links**

Add `## Cross-origin metrics and Timing-Allow-Origin` with:

```http
Server-Timing: edge;dur=12.4, origin;dur=84.1
Timing-Allow-Origin: https://app.example
```

Implement the six-step diagnostic sequence from spec section 6.7. Link to `[Timing-Allow-Origin](/headers/timing-allow-origin/)` and keep TAO separate from CORS and body access.

Add `## Debug missing or misleading Server-Timing metrics` with the eight-row table defined in spec section 6.8. Add contextual links to `[Cache-Control](/headers/cache-control/)` for hit/miss behavior and `[X-Runtime](/headers/x-runtime/)` for the standard-versus-non-standard boundary.

Add `## Design production metrics without leaking internals` and implement every operational rule in spec section 6.9: vocabulary ownership, documented boundaries, milliseconds, rounding, overhead, forbidden identifiers, audience decisions, path coverage, private observability, and metric removal.

- [ ] **Step 10: Run focused contracts and make them GREEN**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts
```

Expected: PASS for the new Server-Timing contract and all existing guide contracts. If the MDAST parser represents the raw figure as more than one HTML node, join the collected HTML nodes before JSDOM parsing; do not replace the structural check with a prose search.

- [ ] **Step 11: Verify the source diff and commit Task 1**

Run:

```bash
git diff --check
git diff -- src/content/headers/server-timing.md src/lib/headerContentContract.test.ts
```

Confirm no unrelated guide changes and no fixed explanatory-sentence assertions. Then commit:

```bash
git add src/content/headers/server-timing.md src/lib/headerContentContract.test.ts
git commit -m "feat: expand Server-Timing debugging guide"
```

## Task 2: Style and render the static request timeline

**Files:**
- Modify: `src/lib/headerReferenceSeoContract.test.ts`
- Modify: `src/components/astro/HeaderGuidePage.astro:147-265`

**Interfaces:**
- Consumes: `figure[data-server-timing-timeline]` and its data attributes from Task 1.
- Produces: scoped static CSS that Task 4 verifies in desktop/mobile rendering without changing any other guide element.

- [ ] **Step 1: Write the failing style-scope contract**

Add a test to `headerReferenceSeoContract.test.ts` that reads `HeaderGuidePage.astro` and asserts:

```ts
expect(component).toContain(
  '.guide-markdown :global(figure[data-server-timing-timeline])'
);
expect(component).toContain(
  '.guide-markdown :global([data-server-timing-timeline] [data-timeline-path])'
);
expect(component).toContain(
  '.guide-markdown :global([data-server-timing-timeline] [data-timing-breakdown])'
);
expect(component).toContain(
  '.guide-markdown :global([data-server-timing-timeline] [data-timing-phase])'
);
expect(component).toContain('@media (max-width: 640px)');
expect(component).not.toContain('.guide-markdown :global(figure) {');
expect(component).not.toContain('client:');
```

This is a renderer-style contract, not a prose contract. Keep the existing light-code-card contract unchanged.

- [ ] **Step 2: Run the focused SEO contract to prove RED**

Run:

```bash
npm test -- src/lib/headerReferenceSeoContract.test.ts
```

Expected: FAIL because the timeline selectors do not yet exist.

- [ ] **Step 3: Add narrowly scoped timeline styles**

Append styles inside `HeaderGuidePage.astro`'s existing `<style>` block. Use this structure and existing tokens:

```css
.guide-markdown :global(figure[data-server-timing-timeline]) {
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.625rem;
  background-color: var(--card);
  padding: 1.25rem;
}

.guide-markdown :global([data-server-timing-timeline] [data-timeline-path]) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.guide-markdown :global([data-server-timing-timeline] [data-timeline-path] li) {
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background-color: color-mix(in oklab, var(--muted) 30%, transparent);
  padding: 0.75rem;
  color: var(--foreground);
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
}

.guide-markdown :global([data-server-timing-timeline] [data-timing-total]) {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.25rem;
  color: var(--foreground);
}

.guide-markdown :global([data-server-timing-timeline] [data-timing-breakdown]) {
  display: grid;
  grid-template-columns: 53.2fr 41.8fr 33fr;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.guide-markdown :global([data-server-timing-timeline] [data-timing-phase]) {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background-color: color-mix(in oklab, var(--muted) 45%, transparent);
  padding: 0.75rem;
}

.guide-markdown :global([data-server-timing-timeline] dt) {
  color: var(--foreground);
  font-weight: 600;
}

.guide-markdown :global([data-server-timing-timeline] dd) {
  margin: 0.25rem 0 0;
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

.guide-markdown :global([data-server-timing-timeline] [data-timing-field]) {
  overflow-wrap: anywhere;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background-color: color-mix(in oklab, var(--muted) 30%, transparent);
  padding: 0.75rem;
}

.guide-markdown :global([data-server-timing-timeline] figcaption) {
  margin-top: 1rem;
  color: var(--muted-foreground);
  font-size: 0.875rem;
  line-height: 1.5rem;
}
```

Inside the existing `@media (max-width: 640px)` block, add:

```css
.guide-markdown :global([data-server-timing-timeline] [data-timeline-path]),
.guide-markdown :global([data-server-timing-timeline] [data-timing-breakdown]) {
  grid-template-columns: 1fr;
}

.guide-markdown :global([data-server-timing-timeline] [data-timing-total]) {
  flex-direction: column;
  gap: 0.25rem;
}
```

Do not introduce colors that carry meaning by themselves. Phase names and values remain visible text.

- [ ] **Step 4: Run focused tests and build**

Run:

```bash
npm test -- src/lib/headerReferenceSeoContract.test.ts src/lib/headerContentContract.test.ts
npm run build
```

Expected: both test files PASS; Astro check, TypeScript build, static route generation, and sitemap generation complete successfully.

- [ ] **Step 5: Inspect generated static HTML**

Run:

```bash
rg -n "data-server-timing-timeline|figcaption|Timing-Allow-Origin|performance.getEntriesByType" dist/headers/server-timing/index.html
rg -n "headers/server-timing/" dist/sitemap-*.xml
```

Expected: the figure, figcaption, contextual content, and route are present in static output. Confirm no `astro-island` appears inside the timeline figure.

- [ ] **Step 6: Verify the scoped diff and commit Task 2**

Run:

```bash
git diff --check
git diff -- src/components/astro/HeaderGuidePage.astro src/lib/headerReferenceSeoContract.test.ts
```

Confirm no generic figure restyling and no change to existing code, list, or table styles. Commit:

```bash
git add src/components/astro/HeaderGuidePage.astro src/lib/headerReferenceSeoContract.test.ts
git commit -m "feat: add Server-Timing request timeline"
```

## Task 3: Perform independent protocol and runtime review

**Files:**
- Review: `src/content/headers/server-timing.md`
- Review: `src/components/astro/HeaderGuidePage.astro`
- Modify if findings require: `src/content/headers/server-timing.md`
- Modify if findings require: `src/lib/headerContentContract.test.ts`

**Interfaces:**
- Consumes: completed guide, code examples, visual semantics, and structural tests from Tasks 1–2.
- Produces: a technically reviewed guide with no unresolved critical or important finding and tests hardened around code/structure rather than prose.

- [ ] **Step 1: Review the field grammar against W3C Server Timing**

Open `https://www.w3.org/TR/server-timing/` and check each guide claim against the current sections for the field grammar, parsing, `PerformanceServerTiming`, privacy/security, and examples.

Record pass/fail notes for:

- required metric name;
- optional `dur` and `desc`;
- recommended but unenforceable millisecond unit;
- invalid or absent `dur` returning `0`;
- absent `desc` returning an empty string;
- repeated metric names exposing all entries;
- first repeated parameter winning;
- unknown parameters being ignored;
- metric order not carrying semantics;
- intentionally absent start-time attribution;
- trailer support.

Fix any mismatch immediately in the guide. Do not encode review conclusions as full-sentence tests.

- [ ] **Step 2: Review Performance API and cross-origin boundaries**

Open the current W3C Resource Timing specification and MDN `PerformanceServerTiming` reference. Check:

- navigation and resource entry handling;
- `serverTiming` array shape;
- DevTools versus script visibility;
- same-origin default;
- `Timing-Allow-Origin` as cross-origin timing permission;
- the specification allowance for a user agent to retain the same-origin restriction;
- separation from CORS, body access, credentials, authentication, and authorization.

Fix inaccurate or overbroad wording. Keep the TAO section bounded and preserve its contextual link.

- [ ] **Step 3: Review Express and Worker examples against runtime sources**

Open current Node.js `perf_hooks` documentation and Cloudflare Workers `Performance and timers` documentation. Verify:

- Express uses a monotonic performance clock;
- header emission occurs before body send;
- measured phase boundaries match the text;
- untrusted data is not interpolated;
- Worker uses an explicit upstream host;
- Worker times awaited I/O;
- deployed Worker timers are not presented as CPU timers;
- local timer behavior is not generalized to production;
- response body remains streaming;
- copied headers are mutable before append;
- status and status text are preserved.

If a runtime source invalidates the approved snippet, correct the snippet and its structural test together.

- [ ] **Step 4: Review privacy, intermediary, caching, and overhead claims**

Verify that the guide never publishes or recommends query text, user/tenant IDs, trace tokens, private hosts, shard names, exceptions, or dynamic untrusted descriptions. Confirm that cache-hit/miss and intermediary metrics are attributed conditionally, not automatically to the origin.

Confirm the guide says selected public metadata is not private tracing, access control, or a trusted total. Confirm metric names/descriptions are short and precision is deliberate.

- [ ] **Step 5: Harden structural tests only where review found a falsifiable code or structure risk**

Allowed hardening examples:

- parse a changed JS/TS snippet and fail on syntax errors;
- reject a Worker snippet that buffers `upstreamResponse`;
- reject a Worker snippet that fetches `request` directly instead of `upstreamUrl`;
- reject an Express snippet that sets the field after body send;
- reject a removed figcaption, TAO link, or troubleshooting table column.

Do not add assertions that require a technical explanation to contain one approved sentence.

- [ ] **Step 6: Run fresh focused verification**

Run:

```bash
npm test -- src/lib/headerContentContract.test.ts src/lib/headerReferenceSeoContract.test.ts
npm run lint
npm run build
```

Expected: focused tests, ESLint, Astro check, TypeScript, static build, and sitemap generation all pass.

- [ ] **Step 7: Commit review corrections if the review changed files**

If the review produced changes:

```bash
git add src/content/headers/server-timing.md src/lib/headerContentContract.test.ts src/components/astro/HeaderGuidePage.astro src/lib/headerReferenceSeoContract.test.ts
git commit -m "fix: harden Server-Timing guidance"
```

If there are no changes, record the review result in the execution notes without creating an empty commit.

## Task 4: Visual QA, full verification, and roadmap completion

**Files:**
- Modify: `SEO_PLAN.md`
- Modify: `docs/superpowers/plans/2026-08-14-server-timing-seo.md`
- Verify: `dist/headers/server-timing/index.html`
- Verify: generated sitemap file

**Interfaces:**
- Consumes: reviewed guide, structural tests, static figure, and scoped renderer CSS.
- Produces: verified implementation state and roadmap traceability; deployment remains a separate action.

- [ ] **Step 1: Run the complete automated verification suite**

Run each command independently and retain exit status:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all Vitest files pass with zero failures; ESLint reports zero errors; Astro check, TypeScript, static build, and sitemap generation succeed; diff check reports no whitespace errors.

- [ ] **Step 2: Start the local site for visual QA**

Run:

```bash
npm run dev:web -- --host 127.0.0.1 --port 4321
```

Keep the process running in a managed terminal session. Before browser automation, invoke and read the `playwright` skill.

- [ ] **Step 3: Verify desktop rendering in a real browser**

Open:

```text
http://127.0.0.1:4321/headers/server-timing/
```

At a representative desktop viewport, verify and capture evidence for:

- one H1 and the exact approved H2 sequence;
- light syntax/example cards;
- four timeline path nodes;
- three phase cards with text values;
- visible raw field and figcaption;
- no page-level horizontal overflow;
- readable Express, Worker, HTTP, and browser API blocks;
- troubleshooting table alignment;
- working contextual links to TAO, X-Runtime, Cache-Control, and the checker;
- no client hydration for the timeline.

- [ ] **Step 4: Verify mobile rendering at 320px and a standard mobile width**

At 320px and at least one standard mobile viewport, verify:

- path nodes and timing phases stack to one column;
- labels and values are not clipped;
- the timeline has no horizontal overflow;
- code blocks and the troubleshooting table scroll inside their own containers;
- body text, lists, and links remain readable;
- the sidebar content follows the guide without covering it.

If visual defects appear, write a failing scoped contract where practical, fix only the timeline/guide renderer, rerun focused tests and build, and repeat both browser widths.

- [ ] **Step 5: Verify SEO output and source boundaries**

Run:

```bash
rg -n "Server-Timing HTTP Header — Syntax & Examples \| HTTP Scanner" dist/headers/server-timing/index.html
rg -n "Learn how Server-Timing exposes selected backend metrics" dist/headers/server-timing/index.html
rg -n "https://httpscanner.com/headers/server-timing/" dist/headers/server-timing/index.html
rg -n "headers/server-timing/" dist/sitemap-*.xml
git diff --name-only ef91fe1..HEAD
```

Expected: title, description, canonical, and sitemap route are present. Changed implementation files remain inside the design's delivery boundaries.

- [ ] **Step 6: Update SEO_PLAN only after all gates pass**

Change the active queue entry to:

```markdown
| 10 | Server-Timing | `DONE` | P0 | 75 impressions, position 30.39 | Expanded as a debugging-first guide after crossing the 30+ impressions and position 11–35 promotion threshold. | [Design](docs/superpowers/specs/2026-08-14-server-timing-seo-design.md) |
```

Collect the implementation commits from Tasks 1–3:

```bash
git log --reverse --format='%h %s' ef91fe1..HEAD
```

Append one completed-task row whose task is `Server-Timing SEO expansion`, status is `DONE`, commit cell contains the exact short hashes returned by that command separated by commas, and observation is `Awaiting deployment, recorded GSC inspection/submission, and comparable 14-day and 21-day results.` Do not claim deployment or GSC submission.

Change section 12 to the next eligible roadmap task, `Content-Security-Policy`, without changing its P1 priority unless newer GSC evidence exists.

- [ ] **Step 7: Run final documentation and repository verification**

Run:

```bash
git diff --check
rg -n "Server-Timing|Content-Security-Policy|Awaiting deployment" SEO_PLAN.md
git status --short
```

Expected: no whitespace errors; roadmap contains the DONE entry, exact commits, awaiting-deployment state, and CSP as next; only intended tracked files are modified. Ignore `.superpowers/` visual-companion artifacts and do not stage them.

- [ ] **Step 8: Commit roadmap and record plan completion**

After Tasks 1–4 Steps 1–7 have succeeded, change only those completed checkboxes from `- [ ]` to `- [x]`. Leave this Step 8 unchecked for the first commit, then verify it is the sole remaining unchecked implementation step:

```bash
rg -n "^- \[ \]" docs/superpowers/plans/2026-08-14-server-timing-seo.md
```

Expected: exactly one match, for `Step 8: Commit roadmap and record plan completion`.

Create the completion commit:

```bash
git add SEO_PLAN.md docs/superpowers/plans/2026-08-14-server-timing-seo.md
git commit -m "docs: complete Server-Timing SEO task"
```

After the commit succeeds, change this Step 8 checkbox to `- [x]`, stage only the plan, and amend the same completion commit:

```bash
git add docs/superpowers/plans/2026-08-14-server-timing-seo.md
git commit --amend --no-edit
rg -n "^- \[ \]" docs/superpowers/plans/2026-08-14-server-timing-seo.md
git status --short
```

Expected: the amended commit succeeds; the unchecked-step search prints nothing; tracked files are clean; only ignored or untracked `.superpowers/` visual-companion artifacts may remain.

### Deployment boundary

Report:

- implementation commit hashes;
- focused and full test counts;
- lint and build results;
- desktop/mobile QA evidence;
- production URL to deploy and inspect: `https://httpscanner.com/headers/server-timing/`;
- explicit state: `Awaiting deployment and URL-filtered GSC observation.`

Do not run `npm run deploy` until the user separately authorizes deployment.
