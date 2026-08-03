---
headerName: cross-origin-resource-policy
description: Cross-Origin-Resource-Policy lets a resource restrict which origins or sites may embed its no-CORS response in a browser document.
applicability: response
syntax: "Cross-Origin-Resource-Policy: same-origin | same-site | cross-origin"
examples:
  - "Cross-Origin-Resource-Policy: same-origin"
  - "Cross-Origin-Resource-Policy: same-site"
useCases:
  - Keep private application resources from being embedded by unrelated origins.
  - Explicitly allow a public asset to participate in a COEP-protected application.
commonMistakes:
  - Confusing same-site with same-origin and overlooking sibling subdomains within one registrable site.
  - Applying same-origin to CDN-hosted assets without testing the consuming application's origin.
securityConsiderations: CORP can reduce cross-origin data exposure through no-CORS embedding, but it does not authorize API reads or sanitize public resource contents.
relatedHeaders:
  - cross-origin-embedder-policy
  - cross-origin-opener-policy
  - access-control-allow-origin
references:
  - label: Fetch Standard Cross-Origin-Resource-Policy
    url: https://fetch.spec.whatwg.org/#cross-origin-resource-policy-header
  - label: MDN Cross-Origin-Resource-Policy
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Resource-Policy
---
## Meaning and behavior

Cross-Origin-Resource-Policy, or CORP, is sent by a resource to constrain no-CORS cross-origin use of its response. `same-origin` permits use only when the requesting origin matches, including scheme, host, and port. `same-site` permits origins belonging to the same schemeful site, a broader boundary that can include sibling subdomains. `cross-origin` explicitly permits cross-origin use and is useful when a public resource must load inside a document protected by Cross-Origin-Embedder-Policy.

CORP differs from CORS. CORS determines whether a browser exposes a response to script in a CORS request. CORP can block a no-CORS response body from being delivered for embedding even though the network request was made. It also differs from COEP: COEP is declared by the embedding document, while CORP is an opt-in statement from the resource. Choosing the wrong boundary can break images, fonts, media, and scripts served from a separate asset origin.

## Implementation notes

Classify each resource by intended consumers. Use `same-origin` for private resources with no cross-origin embedding requirement, and consider `same-site` only after reviewing the trustworthiness of every sibling origin. Use `cross-origin` for genuinely public assets that need explicit compatibility, not as a blanket default. Verify asset hosts, CDN aliases, redirects, cached variants, and error responses. Test from both an allowed document and an unrelated origin. When COEP is involved, confirm that the request mode and CORS headers also align; CORP alone does not guarantee every cross-origin loading path succeeds.
