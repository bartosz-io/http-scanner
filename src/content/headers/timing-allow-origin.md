---
headerName: timing-allow-origin
description: Timing-Allow-Origin identifies origins whose browser scripts may access detailed cross-origin Resource Timing data for the response resource.
applicability: response
syntax: "Timing-Allow-Origin: <serialized-origin>[, ...] | *"
examples:
  - "Timing-Allow-Origin: https://app.example"
  - "Timing-Allow-Origin: *"
useCases:
  - Let a trusted monitoring frontend measure detailed timing for resources served from a separate asset origin.
  - Publish timing visibility for intentionally public static resources used across many sites.
commonMistakes:
  - Assuming Timing-Allow-Origin grants permission to read the response body like CORS.
  - Using a wildcard on sensitive resources without reviewing timing and cache-state leakage.
securityConsiderations: Detailed cross-origin timing can reveal cache state, network characteristics, and user-dependent behavior, so permission should match a documented measurement need.
relatedHeaders:
  - server-timing
  - access-control-allow-origin
  - cross-origin-resource-policy
references:
  - label: W3C Resource Timing
    url: https://www.w3.org/TR/resource-timing/
  - label: MDN Timing-Allow-Origin
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Timing-Allow-Origin
---
## Meaning and behavior

Timing-Allow-Origin, or TAO, controls whether browser script from another origin can access detailed Resource Timing information for the response resource. Without suitable permission, cross-origin entries expose a reduced set of attributes to limit information leakage. A matching serialized origin grants access for that origin, while `*` permits any origin under the specification's rules. The field affects timing visibility and does not authorize reading response bytes, sending credentials, or bypassing CORS.

TAO can also make eligible Server-Timing metrics visible with the resource entry. This increases observability for applications whose scripts, fonts, images, or API resources are served from separate origins. It also increases the information available to embedded or third-party code, including cache-hit distinctions and network timing. Permission should therefore be intentional even when the resource body is public.

## Implementation notes

Identify the exact monitoring origin that needs detailed data and return a narrow serialized origin where practical. Use `*` only after deciding the timing information is public. Keep CORS, CORP, credentials, and content access configured independently. Test from allowed and denied origins using the Performance API, including cached, redirected, error, and CDN-served responses. Review Server-Timing descriptions and precision before exposing them through TAO. When a CDN varies permission by requesting origin, configure caching to avoid cross-origin reuse of the wrong policy. Remove the field when no maintained measurement workflow consumes it.
