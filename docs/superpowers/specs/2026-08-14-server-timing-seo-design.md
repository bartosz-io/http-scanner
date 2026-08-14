# Server-Timing SEO Design

Date: 2026-08-14
Parent roadmap: [`SEO_PLAN.md`](../../../SEO_PLAN.md)
Status: approved on 2026-08-14

## 1. Goal

Expand `/headers/server-timing/` from a short protocol summary into a debugging-first guide that helps a developer emit selected backend metrics, inspect them in browser developer tools, read them through the Performance API, and identify which parts of a request are not explained by the published metrics.

The guide must remain a technically accurate HTTP header reference. It should use one compact request-timeline visualization and two bounded implementation examples, Express and Cloudflare Workers, to add practical value beyond syntax-focused W3C and MDN pages. It must not imply that `Server-Timing` measures complete end-to-end latency, creates a standardized trace, or exposes a meaningful server-side start time on the browser timeline.

The primary reader question is:

> “How do I add `Server-Timing`, see backend metrics in the browser, and determine which part of the request is still unexplained?”

## 2. Evidence and prioritization

### Current GSC evidence

Source: `outputs/httpscanner.com-Performance-on-Search-2026-08-14/`, covering the rolling 28-day period from 2026-07-16 through 2026-08-12.

Page-level baseline for `/headers/server-timing/`:

| Clicks | Impressions | CTR | Average position |
|---:|---:|---:|---:|
| 0 | 75 | 0% | 30.39 |

The disclosed exact query `server timing` has:

| Clicks | Impressions | CTR | Average position |
|---:|---:|---:|---:|
| 0 | 26 | 0% | 39 |

The page has the strongest current GSC evidence among unoptimized guides that meet the roadmap promotion rule of at least 30 impressions and an average position between 11 and 35. It therefore moves from roadmap order 32, `QUEUED`, P1 to active order 10, `NEXT`, P0, ahead of `Content-Security-Policy`.

### SERP pattern

The current result set for the core intent is led by W3C and MDN reference material, followed by syntax-oriented header references and vendor implementation articles. The opportunity is not to reproduce the specification. The page should differentiate through a coherent debugging journey:

1. understand the measurement boundary;
2. inspect the final response and DevTools;
3. read the metrics from JavaScript;
4. add a minimal server or edge implementation;
5. diagnose missing, empty, zero, cached, or misleading values;
6. publish only a reviewed metric set.

## 3. Sources of technical truth

Resolve technical conflicts in this order:

1. [W3C Server Timing](https://www.w3.org/TR/server-timing/)
2. [W3C Resource Timing](https://www.w3.org/TR/resource-timing/)
3. [Cloudflare Workers — Performance and timers](https://developers.cloudflare.com/workers/runtime-apis/performance/)
4. [Node.js Performance Measurement APIs](https://nodejs.org/api/perf_hooks.html)
5. [MDN — Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing)
6. [MDN — PerformanceServerTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceServerTiming)

W3C defines the field, parsing model, Performance API, privacy boundary, and relationship with Resource Timing. Cloudflare documentation is authoritative for the production Workers timer restriction. Node.js documentation is authoritative for the Express example's clock. MDN is a secondary readability and browser-compatibility check.

## 4. Reader outcome

After reading the guide, a developer should be able to:

- distinguish browser-observed request timing from server-selected metrics;
- use metric names, `dur`, and `desc` correctly;
- understand that metric names may repeat and that all same-name entries are exposed;
- inspect the final `Server-Timing` response after middleware, proxies, and CDNs;
- find eligible metrics in browser developer tools;
- read `PerformanceServerTiming` objects from navigation and resource entries;
- add a minimal Express implementation without a third-party timing library;
- add a Cloudflare Worker metric around an I/O operation without claiming to measure local CPU time;
- diagnose cross-origin script visibility with `Timing-Allow-Origin` without conflating TAO with CORS;
- interpret cache-hit, cache-miss, redirect, error, and intermediary-added metrics cautiously;
- publish short, stable, privacy-reviewed metrics instead of internal tracing data.

## 5. Non-goals

- Do not change the route, canonical URL, title-generation pattern, content collection, or report/scanner engine.
- Do not create an interactive timeline, live profiler, RUM collector, benchmark, trace viewer, or Server-Timing generator.
- Do not convert the Markdown guide to MDX or add a client-side island.
- Do not add dependencies for Express middleware, syntax rendering, charting, or timing collection.
- Do not provide a broad framework cookbook for Nginx, Apache, PHP, Rails, Django, Go, Java, or vendor CDNs.
- Do not provide an OpenTelemetry or distributed-tracing tutorial.
- Do not give a full HTTP trailer implementation. Mention trailers only as an advanced delivery mechanism supported by the field specification.
- Do not claim that all browsers expose the same DevTools labels or layout.
- Do not claim that `Timing-Allow-Origin` grants CORS permission, response-body access, authentication, or authorization.
- Do not claim that a metric duration is trustworthy, exhaustive, non-overlapping, or generated by the origin rather than an intermediary.
- Do not treat `Server-Timing` as a substitute for private traces, logs, metrics, or profiling.
- Do not deploy, submit to GSC, or claim SEO uplift during implementation without separate authorization and evidence.

## 6. Content architecture

Keep the existing `Meaning and behavior` and `Implementation notes` sections as concise foundations. Edit them where necessary to remove duplication and align them with the detailed sections below. Append the following sections in order.

### 6.1 `Where Server-Timing fits in a request`

Open with the selected static request timeline:

```text
Browser → CDN → Application → Database → Response
```

Use one deliberately bounded teaching example:

- browser-observed response wait: `128 ms`;
- `db`: `53.2 ms`;
- `app`: `41.8 ms`;
- unreported portion in this teaching model: `33 ms`.

The example must state that `db` and `app` are defined as non-overlapping spans only for this illustration. Real emitters may publish overlapping, nested, partial, or independently measured metrics. A browser cannot generally compute an unexplained segment by subtracting arbitrary Server-Timing values from TTFB.

Bind the visualization to this response field:

```http
Server-Timing: db;dur=53.2, app;dur=41.8
```

The explanation must separate:

- browser-observed navigation or resource timing;
- server-selected named metrics;
- time spent in networks, queues, TLS, CDN handling, middleware, serialization, streaming, and other unreported phases.

State that the specification intentionally omits a server metric `startTime` because client, server, and intermediary clocks cannot be assumed to be synchronized.

### 6.2 `Server-Timing syntax: names, dur, and desc`

Explain the field grammar through progressively richer examples:

```http
Server-Timing: cache
Server-Timing: db;dur=53.2
Server-Timing: app;dur=41.8;desc="Application"
Server-Timing: db;dur=53.2, app;dur=41.8;desc="Application"
```

Cover these rules precisely:

- a metric name is required;
- `dur` and `desc` are optional;
- emitted `dur` values in this guide use milliseconds, which is the specification's recommendation rather than an enforceable wire-level unit;
- missing or invalid `dur` becomes `0` through the `PerformanceServerTiming.duration` getter;
- missing `desc` becomes an empty string;
- `desc` may require a quoted string when it contains spaces;
- multiple metrics can appear in a comma-separated field value or across field lines;
- the same metric name may appear more than once and user agents expose all entries;
- parameter names should not repeat within one metric; when they do, only the first occurrence is considered;
- unknown parameters are ignored by user agents rather than invalidating the recognized metric;
- metric order is not semantically significant, except that first-occurrence handling matters for repeated parameters.

Mention that `Server-Timing` can be delivered in a trailer, but keep the main implementation examples header-first because trailer generation and JavaScript access vary by protocol stack and client surface.

### 6.3 `Inspect Server-Timing in browser DevTools`

Provide a browser-neutral ordered workflow:

1. reproduce the request with Network recording enabled;
2. select the final request after redirects;
3. confirm the raw `Server-Timing` response field;
4. inspect any Server Timing or equivalent timing breakdown surfaced by the browser;
5. compare the named metrics with waiting, response start, transfer, and total duration without assuming they share the same start point;
6. reload across cache-hit and cache-miss paths;
7. inspect whether a CDN, proxy, gateway, or framework added, removed, merged, or replaced metrics.

Do not promise one browser-specific tab name. Explain that DevTools visibility and JavaScript visibility are separate surfaces with separate diagnostics.

### 6.4 `Read Server-Timing from JavaScript`

Show a compact example that handles navigation and subresources instead of implying every metric lives on a resource entry:

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

Explain that:

- `serverTiming` is a frozen array on eligible `PerformanceResourceTiming` entries, including the navigation timing subtype;
- a missing metric duration is represented as `0`, so `0` does not prove that measured work took zero milliseconds;
- the entry buffer and collection timing can affect which resources appear;
- code should select a specific URL or observe new resource entries in production rather than repeatedly scanning an unbounded set;
- cross-origin exposure requires a separate privacy decision covered in section 6.7.

Keep analytics collection outside scope. The code demonstrates access and inspection only.

### 6.5 `Add Server-Timing in Express`

Use one dependency-free route example based on Node's monotonic performance clock. It should measure two explicit non-overlapping phases, set the response field before the response is committed, and round values to one decimal place.

The example contract is:

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

The surrounding text must say what the values exclude: work before the route, queueing, downstream transfer, response streaming, and any middleware that runs outside the measured spans. It must also note that application code should serialize descriptions safely rather than interpolating untrusted values into the field.

Do not present a response-finish hook as a way to set the normal response header after headers may already have been sent. If total server work is only known after the response body, treat trailers or private observability as a separate design rather than silently publishing a partial value as total.

### 6.6 `Add Server-Timing in a Cloudflare Worker`

Use an upstream subrequest example because production Workers timers advance after I/O and do not provide a meaningful local CPU-span measurement.

The example contract is:

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

The text must explain:

- the measurement covers the awaited upstream fetch as observed by the Worker;
- the explicit upstream host avoids implying that a Worker should fetch its own public route recursively;
- it is not an origin-only duration, Worker CPU duration, complete edge duration, TTFB, or final-byte time;
- `performance.now()` and `Date.now()` do not advance during local CPU execution in a deployed Worker;
- local development timing behavior differs and must not be used to infer production CPU spans;
- Cloudflare or another intermediary can emit its own metrics, so name ownership and field merging need review;
- private Worker traces and platform analytics remain the better source for detailed operations analysis.

### 6.7 `Cross-origin metrics and Timing-Allow-Origin`

Use one narrow response example:

```http
Server-Timing: edge;dur=12.4, origin;dur=84.1
Timing-Allow-Origin: https://app.example
```

Explain the diagnostic sequence:

1. confirm that the raw `Server-Timing` field is present;
2. confirm that the resource is cross-origin relative to the observing page;
3. inspect whether `Timing-Allow-Origin` permits the observing origin;
4. retry from an allowed and a denied origin;
5. check redirects and every final response path because timing permission can be lost or changed;
6. verify actual browser behavior because the Server Timing specification permits a user agent to retain the same-origin restriction.

State explicitly that TAO controls exposure of detailed Resource Timing and eligible Server-Timing data to script. It does not grant permission to read response bytes, satisfy CORS, send credentials, authenticate a user, or authorize application data.

Link contextually to `/headers/timing-allow-origin/` for the full TAO reference. Do not reproduce wildcard, origin serialization, credential, cache, and resource policy material beyond what is necessary to diagnose an empty `serverTiming` array.

### 6.8 `Debug missing or misleading Server-Timing metrics`

Provide a compact Markdown table with columns `Symptom`, `Likely cause`, and `Check`. Cover at least:

| Symptom | Likely cause | Check |
|---|---|---|
| No raw field in the final response | Application path omitted it or an intermediary removed it | Compare origin, gateway, CDN, redirect, error, and final responses |
| DevTools shows the field but JavaScript has no metrics | Cross-origin timing exposure is restricted | Verify the observing origin and `Timing-Allow-Origin` |
| Duration is `0` | `dur` is missing, invalid, rounded to zero, or measured with a non-advancing clock | Inspect the raw parameter and runtime timer behavior |
| Metrics do not add up to waiting or TTFB | Metrics are partial, nested, overlapping, or use different boundaries | Document each start and stop point; do not sum arbitrary values |
| Cache hit and miss expose different metrics | Different response producers or code paths emitted them | Compare cache status, age, origin reachability, and field ownership |
| The field disappears on errors or redirects | Only the success handler adds it | Instrument and test each intended response path separately |
| An unexpected metric appears | CDN, proxy, gateway, or framework appended it | Inspect each boundary and establish a metric-name ownership policy |
| The header is unexpectedly large | Names, descriptions, or metric count are uncontrolled | Shorten the reviewed vocabulary and remove unused metrics |

Do not turn the table into prose-string tests. Technical explanations require independent source review.

### 6.9 `Design production metrics without leaking internals`

Give a short operational framework:

- define a small stable vocabulary and an owner for each metric name;
- document the exact start point, stop point, unit, overlap, cache path, and response paths for every metric;
- emit milliseconds consistently even though the wire syntax cannot enforce the unit;
- round to useful precision and avoid publishing unnecessary high-resolution differences;
- keep names and descriptions short to control response overhead;
- never publish query text, tenant or user identifiers, trace IDs, shard names, private hosts, exception details, or dynamic untrusted descriptions;
- decide which metrics are public, same-origin only, cross-origin, authenticated-only, sampled, or disabled;
- test success, error, redirect, cache hit, cache miss, authenticated, anonymous, and streamed paths;
- use private tracing, logs, profiling, and platform analytics for high-cardinality or sensitive diagnostics;
- remove public metrics that have no maintained debugging or monitoring consumer.

Close with the boundary: `Server-Timing` is selected public response metadata, not a trusted measurement, access-control mechanism, or complete observability system.

## 7. Visual design

Implement the approved request timeline as semantic raw HTML inside `server-timing.md` and narrowly scoped styles in `HeaderGuidePage.astro`.

The content must use:

- one `<figure data-server-timing-timeline>` root;
- a visible request path with browser, CDN, application, and database labels;
- text labels for the `128 ms`, `53.2 ms`, `41.8 ms`, and `33 ms` values;
- a visible raw `Server-Timing` value;
- a `<figcaption>` that explains the illustrative non-overlapping spans and warns against subtracting arbitrary real metrics from TTFB;
- semantic source order that remains understandable without CSS;
- no client JavaScript, animation, SVG, canvas, external asset, or chart dependency.

Style requirements:

- match the established light code-card palette and border radius;
- use design tokens such as `--border`, `--card`, `--muted`, `--foreground`, and `--muted-foreground`;
- do not rely on color alone to communicate phase names or values;
- maintain readable contrast and keyboard-independent content;
- fit the guide content column without horizontal overflow at desktop widths;
- stack the path and metric segments vertically at 640px or below;
- keep all labels and values visible at a 320px viewport;
- do not alter unrelated Markdown tables, lists, or code blocks.

The renderer change must target the figure's data attribute or another equally narrow semantic selector. Do not add styles that change all figures across the site.

## 8. Frontmatter and metadata

Preserve `headerName`, applicability, use cases, common mistakes, security considerations, related headers, and existing references unless technical review finds a factual issue.

Update the description to communicate practical intent without keyword repetition. Target meaning:

> Learn how the Server-Timing response header exposes selected backend metrics in DevTools and the Performance API, with syntax, implementation, and debugging examples.

Keep the generated title unchanged:

```text
Server-Timing HTTP Header — Syntax & Examples | HTTP Scanner
```

Keep the canonical URL unchanged:

```text
https://httpscanner.com/headers/server-timing/
```

Add a second frontmatter example that demonstrates `desc`, while keeping examples safe to copy:

```http
Server-Timing: cache;desc="Cache hit", db;dur=53.2, app;dur=41.8
```

If review finds that frontmatter syntax should show the specification's recommended millisecond convention rather than promise an enforced unit, correct it consistently across syntax and prose.

## 9. Internal linking

Outgoing contextual links:

- `/headers/timing-allow-origin/` from the cross-origin JavaScript section;
- `/headers/x-runtime/` from the standardized-versus-non-standard timing boundary;
- `/headers/cache-control/` from cache-hit and cache-miss diagnostics;
- `/http-headers-checker/` through the existing sidebar CTA.

Preserve the current related-header set unless review identifies a stronger replacement:

- `timing-allow-origin`;
- `x-runtime`;
- `cache-control`.

Existing incoming related-header links from `Timing-Allow-Origin`, `X-Runtime`, and `Link` already support discovery. Do not add reciprocal links merely to increase link count. Add or change an incoming link only when it improves the neighboring guide's user journey.

## 10. Accuracy guardrails

- Describe `Server-Timing` as server- or intermediary-selected response metadata, not as an objective trace.
- Do not imply that the header measures DNS, connection, TLS, queueing, download, final-byte time, or all backend work unless an explicitly defined metric does so.
- Do not state that arbitrary metric durations can be summed or subtracted from TTFB.
- Treat milliseconds as the recommended and guide-required emission unit, not an enforceable property of every wire value.
- Explain that missing or invalid `dur` is exposed as `0` by the API.
- Explain that missing `desc` is exposed as an empty string.
- Allow repeated metric names and preserve the fact that user agents expose all such entries.
- State that only the first repeated parameter name within one metric is considered.
- Do not invent a standard `startTime` for individual metrics.
- Keep DevTools visibility separate from JavaScript visibility.
- Do not imply that TAO guarantees exposure in every user agent; the specification permits retaining the same-origin restriction.
- Keep TAO, CORS, content access, credentials, authentication, and authorization separate.
- Do not imply that a public response body makes detailed timing safe to expose.
- Do not use Cloudflare Workers timers to claim a production CPU duration.
- Preserve streaming: the Worker example must not buffer the upstream response body merely to add the field.
- Do not claim that an intermediary-added metric was measured at the origin.
- Do not interpolate user-controlled strings into metric names, descriptions, or raw field values.
- Explain that fine precision, path-dependent names, and descriptions can expose cache state, infrastructure, routing, or user-dependent behavior.

## 11. Testing strategy

Do not test for complete explanatory sentences or fixed prose fragments. Correctness of explanations is reviewed independently against the sources in section 3.

### Structural content contract

Extend the existing MDAST-based header content contract to verify structure rather than wording:

- the required H2 sequence exists and is unique;
- the timeline is represented by one figure with a figcaption and text values;
- HTTP, JavaScript, and TypeScript examples are separate fenced or raw-code structures with declared languages where supported;
- the troubleshooting section contains a Markdown table with the required three-column shape and sufficient data rows;
- the TAO, X-Runtime, and Cache-Control links resolve to existing guide routes;
- the guide retains at least three related headers and all names resolve through the catalog;
- the implementation examples contain parseable JavaScript or TypeScript;
- the Worker example returns the upstream body without converting it to text, JSON, or an in-memory buffer.

Assertions may inspect AST node types, headings, link destinations, code-block languages, and independently parse code examples. They must not require a specific pedagogical sentence to appear.

### Rendering and SEO contract

Verify that a production build renders:

- the unchanged canonical URL;
- the generated title;
- the updated description;
- the guide route in the sitemap;
- the timeline figure and figcaption in static HTML;
- crawlable contextual links;
- no client-side hydration directive for the timeline.

### Visual verification

After automated checks pass:

1. run the local production-shaped site;
2. inspect the guide at a representative desktop viewport;
3. inspect at 320px and a standard mobile viewport;
4. verify no horizontal page overflow;
5. verify code blocks scroll locally where needed;
6. verify the timeline stacks without clipped labels or values;
7. verify the troubleshooting table remains readable and scrolls locally on narrow screens;
8. verify the visual matches the established light guide cards.

### Independent technical review

Review every technical claim and example against W3C Server Timing, W3C Resource Timing, current Cloudflare Workers timer documentation, Node.js performance APIs, and MDN as a secondary compatibility check.

The review must explicitly cover:

- grammar, optional parameters, duplicate names, duplicate parameters, and invalid duration behavior;
- recommended millisecond semantics and absence of metric start time;
- Performance API access for navigation and resource entries;
- same-origin defaults and the TAO permission boundary;
- DevTools versus script visibility;
- Express response-commit timing;
- production Cloudflare Workers timer restrictions and streaming response preservation;
- intermediary and cache behavior;
- response overhead, precision, and sensitive metadata.

## 12. Acceptance criteria

- `SEO_PLAN.md` records the 2026-08-14 GSC baseline and promotes `Server-Timing` to order 10, `NEXT`, P0.
- `/headers/server-timing/` follows the approved debugging-first architecture.
- The page contains the approved semantic timeline and remains useful without CSS.
- The page contains bounded Express, Cloudflare Worker, browser Performance API, and TAO examples.
- The Worker example measures an I/O operation and explicitly rejects local CPU-duration interpretation.
- The guide distinguishes selected metrics, browser-observed timing, TTFB, full response time, and private tracing.
- Internal links are contextual, crawlable, and resolve to existing routes.
- Tests protect structure, parsable examples, links, static rendering, metadata, canonical behavior, and sitemap inclusion without binding explanatory prose.
- Independent technical review has no unresolved critical or important findings.
- Focused tests, full tests, lint, and production build pass with fresh evidence.
- Desktop and mobile visual review passes without overflow, clipping, dark code blocks, or inconsistent table/list formatting.
- The implementation plan checkboxes are complete and the roadmap log records exact implementation commits.
- Deployment, GSC submission, and uplift remain unclaimed until separately completed.

## 13. Measurement

Record the implementation and deployment dates separately. The pre-implementation baseline is:

| Scope | Clicks | Impressions | CTR | Average position |
|---|---:|---:|---:|---:|
| `/headers/server-timing/` | 0 | 75 | 0% | 30.39 |
| Exact disclosed query `server timing` | 0 | 26 | 0% | 39 |

After an explicitly authorized deployment:

1. verify the production route and sitemap;
2. inspect or submit the exact URL in GSC and record the date;
3. preserve the URL and avoid major content changes during the first observation window;
4. record comparable URL-filtered values after 14 days;
5. record comparable URL-filtered values after 21 days;
6. compare clicks, impressions, CTR, average position, disclosed query variants, and checker referrals;
7. record `HOLD`, `ITERATE`, `PROMOTE CLUSTER`, or `DEPRIORITIZE` in `SEO_PLAN.md`.

Do not compare the rolling 28-day page baseline directly with a shorter 14-day total without using GSC's comparable-period view.

## 14. Delivery boundaries

The implementation task may modify only the files required by the approved content, narrow timeline styling, structural tests, and roadmap traceability. Expected files are:

- `src/content/headers/server-timing.md`;
- `src/components/astro/HeaderGuidePage.astro`;
- the relevant MDAST/content and SEO contract tests;
- `SEO_PLAN.md`;
- `docs/superpowers/plans/2026-08-14-server-timing-seo.md`.

Do not modify scanner findings, report generation, Worker scan behavior, database schema, dependencies, analytics events, unrelated guides, or global visual design unless a failing acceptance criterion proves a narrowly scoped change is necessary.
