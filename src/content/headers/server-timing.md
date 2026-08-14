---
headerName: server-timing
description: Learn how Server-Timing exposes selected backend metrics in DevTools and the Performance API, with syntax, implementation, and debugging examples.
applicability: response
syntax: "Server-Timing: <metric-name>[; dur=<recommended-milliseconds>][; desc=<description>][, ...]"
examples:
  - "Server-Timing: db;dur=53.2, app;dur=21.8"
  - 'Server-Timing: cache;desc="Cache hit", db;dur=53.2, app;dur=41.8'
useCases:
  - Correlate selected backend phases with browser-observed navigation or resource timing.
  - Expose coarse performance diagnostics for a controlled monitoring environment.
commonMistakes:
  - Publishing confidential query names, tenant identifiers, hostnames, or trace internals in metric descriptions.
  - Treating reported durations as complete end-to-end latency or as cryptographically trustworthy measurements.
securityConsiderations: Fine-grained timing and descriptions can reveal cache state, code paths, infrastructure, and user-dependent behavior, so expose a minimal reviewed metric set.
relatedHeaders:
  - timing-allow-origin
  - x-runtime
  - cache-control
references:
  - label: W3C Server Timing
    url: https://www.w3.org/TR/server-timing/
  - label: MDN Server-Timing
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing
---
## Meaning and behavior

`Server-Timing` carries named metrics selected by a server or intermediary. A metric name is required; `dur` and `desc` are optional. This guide emits duration values in milliseconds because that is the specification's recommendation, but the wire format does not enforce a unit. Browsers can show eligible metrics in developer tools and expose them through the Performance API according to their timing privacy rules.

The field is selected public response metadata, not a complete trace, a trusted total, an access-control signal, or a guarantee that a metric came from the origin. Metrics can be omitted, overlap, be nested, or be added or changed by intermediaries. Public names, descriptions, and precision need privacy review because they can reveal architecture, cache state, routing, or user-dependent behavior.

## Implementation notes

Define a small stable vocabulary, give each metric an owner, and document its start point, stop point, unit, overlap, cache path, and response paths. Round values to useful precision, keep descriptions short, and omit query text, user identifiers, shard names, private hosts, trace tokens, and exception details. Compare public metrics with private tracing when investigating a request, but do not treat them as interchangeable.

Set a normal response header before the response is committed. Test every intended success, error, redirect, cache, authenticated, anonymous, and streamed path because a different producer can emit a different field. Remove metrics that no maintained debugging or monitoring consumer uses, and keep detailed profiling, logs, and traces private.

## Where Server-Timing fits in a request

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

The browser observes navigation or resource timing across its own request path. `Server-Timing` adds only named metrics that a response producer chose to publish. Networks, queues, TLS, CDN handling, middleware, serialization, streaming, and other phases can remain unreported or use a different boundary.

The `db` and `app` spans above are deliberately non-overlapping only for this teaching model. Real metrics can be overlapping, nested, partial, or independently measured, so a browser cannot generally calculate an unexplained segment by subtracting arbitrary metric values from waiting time or TTFB. The specification does not define a per-metric `startTime`: client, server, and intermediary clocks cannot be assumed to be synchronized.

## Server-Timing syntax: names, dur, and desc

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

A metric name is required, while `dur` and `desc` are optional. This guide emits millisecond values, which are the specification's recommended convention rather than an enforceable wire-level unit. A missing or invalid `dur` is exposed as `0` by `PerformanceServerTiming.duration`; a missing `desc` is exposed as an empty string. Quote a description when it contains spaces or other syntax that requires a quoted string.

Metrics can be comma-separated in one field value or appear across field lines. The same metric name may appear more than once, and user agents expose all of those entries. Parameter names should not repeat within one metric; when they do, only the first occurrence is considered. Unknown parameters are ignored rather than invalidating the recognized metric, and metric order is not semantically significant apart from that first-occurrence rule. There is no standardized metric start time.

`Server-Timing` can also be delivered in a trailer, but the examples here are header-first. Trailer generation and JavaScript access differ by protocol stack and client surface, so use trailers only as a separately designed delivery mechanism.

## Inspect Server-Timing in browser DevTools

Use a browser-neutral diagnostic flow:

1. Reproduce the request with Network recording enabled.
2. Select the final request after redirects.
3. Confirm the raw `Server-Timing` response field.
4. Inspect any Server Timing or equivalent timing breakdown the browser surfaces.
5. Compare named metrics with waiting, response start, transfer, and total duration without assuming they share a start point.
6. Reload across cache-hit and cache-miss paths.
7. Inspect whether a CDN, proxy, gateway, or framework added, removed, merged, or replaced metrics.

DevTools visibility and JavaScript visibility are separate surfaces with separate diagnostics. A visible field does not prove the browser will expose the same data to a script, and a useful browser breakdown does not make the field an end-to-end trace.

## Read Server-Timing from JavaScript

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

`serverTiming` is a frozen array on eligible `PerformanceResourceTiming` entries, including the navigation timing subtype. The loop checks navigation and resource entries because neither surface alone describes every request. A duration of `0` can mean a missing or invalid `dur`, rounding, or a zero result; it does not prove the measured work took zero milliseconds.

The resource entry buffer and the time at which code collects entries can affect which resources appear. Production code should select a specific URL or observe new resource entries instead of repeatedly scanning an unbounded set. Cross-origin script exposure is a separate privacy boundary described below; this example inspects browser entries and does not transmit analytics.

## Add Server-Timing in Express

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

This route measures two explicit non-overlapping phases with Node's monotonic performance clock. It excludes work before the route, queueing, downstream transfer, response streaming, and middleware outside these spans. Set the field before the response is committed; a response-finish hook cannot reliably set a normal header after headers may already have been sent.

Serialize descriptions safely and never interpolate user-controlled values into a metric name, description, or raw field value. If the useful total is known only after the body finishes, design trailers or private observability separately rather than presenting a partial value as a total.

## Add Server-Timing in a Cloudflare Worker

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

This metric covers the awaited upstream fetch as observed by the Worker. The explicit upstream host avoids recursively fetching the Worker's own public route, and returning `upstreamResponse.body` preserves response streaming. It is not an origin-only duration, Worker CPU duration, complete edge duration, TTFB, or final-byte time.

In a deployed Worker, `performance.now()` and `Date.now()` do not advance during local CPU execution, so they are not production CPU-span timers. Local-development timing differs and must not be used to infer a production CPU duration. Cloudflare or another intermediary can emit its own metrics, so review metric-name ownership and field merging. Use private Worker traces and platform analytics for detailed operations analysis.

## Cross-origin metrics and Timing-Allow-Origin

```http
Server-Timing: edge;dur=12.4, origin;dur=84.1
Timing-Allow-Origin: https://app.example
```

For an empty cross-origin `serverTiming` array, work through the boundary in order:

1. Confirm that the raw `Server-Timing` field is present.
2. Confirm that the resource is cross-origin relative to the observing page.
3. Inspect whether `Timing-Allow-Origin` permits the observing origin.
4. Retry from an allowed and a denied origin.
5. Check redirects and every final response path because timing permission can be lost or changed.
6. Verify actual browser behavior because the Server Timing specification permits a user agent to retain the same-origin restriction.

[Timing-Allow-Origin](/headers/timing-allow-origin/) controls exposure of detailed Resource Timing and eligible Server-Timing data to script. It does not grant permission to read response bytes, satisfy CORS, send credentials, authenticate a user, or authorize application data. Those are separate browser, transport, and application boundaries.

## Debug missing or misleading Server-Timing metrics

| Symptom | Likely cause | Check |
| --- | --- | --- |
| No raw field in the final response | Application path omitted it or an intermediary removed it | Compare origin, gateway, CDN, redirect, error, and final responses |
| DevTools shows the field but JavaScript has no metrics | Cross-origin timing exposure is restricted | Verify the observing origin and `Timing-Allow-Origin` |
| Duration is `0` | `dur` is missing, invalid, rounded to zero, or measured with a non-advancing clock | Inspect the raw parameter and runtime timer behavior |
| Metrics do not add up to waiting or TTFB | Metrics are partial, nested, overlapping, or use different boundaries | Document each start and stop point; do not sum arbitrary values |
| Cache hit and miss expose different metrics | Different response producers or code paths emitted them | Compare cache status, age, origin reachability, and field ownership |
| The field disappears on errors or redirects | Only the success handler adds it | Instrument and test each intended response path separately |
| An unexpected metric appears | CDN, proxy, gateway, or framework appended it | Inspect each boundary and establish a metric-name ownership policy |
| The header is unexpectedly large | Names, descriptions, or metric count are uncontrolled | Shorten the reviewed vocabulary and remove unused metrics |

Use [Cache-Control](/headers/cache-control/) and cache status to distinguish hit and miss behavior from a timing change. Use [X-Runtime](/headers/x-runtime/) only when you need to compare this standardized field with a non-standard timing convention; neither field proves an origin measurement or a complete request timeline.

## Design production metrics without leaking internals

Define a small stable vocabulary and an owner for every metric name. Document each metric's exact start and stop point, unit, overlap, cache path, and response paths. Emit milliseconds consistently even though the wire syntax cannot enforce the unit; round to useful precision and avoid unnecessary high-resolution differences. Keep names and descriptions short to control response overhead.

Never publish query text, tenant or user identifiers, trace IDs, shard names, private hosts, exception details, or dynamic untrusted descriptions. Decide whether a metric is public, same-origin only, cross-origin, authenticated-only, sampled, or disabled. Test success, error, redirect, cache hit, cache miss, authenticated, anonymous, and streamed paths.

Use private tracing, logs, profiling, and platform analytics for high-cardinality or sensitive diagnostics. Remove public metrics that have no maintained debugging or monitoring consumer. `Server-Timing` is selected public response metadata, not a trusted measurement, access-control mechanism, or complete observability system.
