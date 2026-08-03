---
headerName: server-timing
description: Server-Timing exposes selected named server metrics such as processing durations or descriptions to browser performance tooling and scripts.
applicability: response
syntax: "Server-Timing: <metric-name>[; dur=<milliseconds>][; desc=<description>][, ...]"
examples:
  - "Server-Timing: db;dur=53.2, app;dur=21.8"
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

Server-Timing communicates named metrics selected by the server. A metric can include `dur`, conventionally a duration in milliseconds, and a human-readable `desc`. Multiple metrics can appear in one list, such as database and application phases. Browsers can display the values in developer tooling and incorporate them into Performance APIs according to response origin and Timing-Allow-Origin rules. The field reports what the server chooses to measure; it is not a standardized trace of every backend component.

A duration may exclude queues, network transfer, edge caching, or work performed after headers are sent. Intermediaries can add, remove, or preserve metrics. Descriptions and metric names are public response metadata and can expose architecture or confidential context. High precision can also amplify timing side channels. Values therefore need a privacy and threat-model review, not only a performance review.

## Implementation notes

Define a small stable vocabulary with documented measurement boundaries. Round durations to useful precision and omit query text, user identifiers, shard names, private hosts, trace tokens, and exception details. Decide whether cross-origin scripts should read metrics; if so, configure Timing-Allow-Origin narrowly. Test origin, CDN hit, CDN miss, error, authenticated, and cached responses because each path can produce different timing. Compare against internal tracing to understand gaps, but keep detailed telemetry private. Remove metrics that no active workflow uses and monitor response size so diagnostic fields do not become performance overhead themselves.
