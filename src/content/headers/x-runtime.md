---
headerName: x-runtime
description: X-Runtime is non-standard timing or framework metadata whose units, precision, and generation rules depend entirely on the emitting application.
applicability: response
syntax: "X-Runtime: <implementation-defined duration>"
examples:
  - "X-Runtime: 0.042"
useCases:
  - Identify a framework timing field that should be replaced with controlled internal telemetry.
  - Compare whether a gateway preserves or removes application-generated diagnostic metadata.
commonMistakes:
  - Assuming every implementation uses seconds or measures the same request-processing interval.
  - Using a public timing value as a reliable performance metric without accounting for queues, caches, and intermediaries.
securityConsiderations: Detailed response timing can reveal behavioral differences to attackers, although removing one field does not eliminate network timing side channels.
relatedHeaders:
  - server-timing
  - x-powered-by
  - server
references:
  - label: Rails Action Controller overview
    url: https://guides.rubyonrails.org/action_controller_overview.html
  - label: W3C Server Timing
    url: https://www.w3.org/TR/server-timing/
---
## Meaning and behavior

X-Runtime is a non-standard field used by some applications and middleware to expose a duration or other runtime diagnostic. The familiar Rails-style value `0.042` is often read as seconds spent processing a request, but HTTP does not define that interpretation. Another implementation can choose different units, start and stop points, rounding, or semantics. A gateway can also cache a response or append its own latency, leaving the application value unrelated to the user's complete experience.

Because behavior is implementation-specific, the field should not be compared across services without documentation. Fine-grained timing can sometimes reveal cache hits, validation branches, or resource-dependent work. Removing it does not remove timing information available from total network measurements, but it avoids publishing an especially convenient server-provided signal. Server-Timing is the standardized alternative for deliberately selected performance metrics, with its own privacy review requirements.

## Implementation notes

Locate the middleware or framework component that adds X-Runtime and determine its exact measurement before using the data. Prefer internal tracing and metrics for operations. If browser performance tooling needs selected values, adopt Server-Timing with coarse, named metrics and avoid confidential identifiers. Test cache hits, errors, redirects, streamed responses, and gateway-generated responses because the field may appear only on some paths. Do not treat a lower value as proof of lower end-to-end latency. Document any retained public metric, its units, precision, and privacy rationale so future teams do not infer unsupported meaning.
