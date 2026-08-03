---
headerName: cross-origin-embedder-policy
description: Cross-Origin-Embedder-Policy requires cross-origin resources used by a document to opt into embedding or be fetched without credentials.
applicability: response
syntax: "Cross-Origin-Embedder-Policy: unsafe-none | require-corp | credentialless"
examples:
  - "Cross-Origin-Embedder-Policy: require-corp"
  - "Cross-Origin-Embedder-Policy: credentialless"
useCases:
  - Establish the embedder side of a cross-origin isolated application.
  - Prevent loading opaque cross-origin resources that have not granted suitable permission.
commonMistakes:
  - Enabling require-corp before third-party images, scripts, fonts, and workers provide CORS or CORP permission.
  - Treating credentialless as equivalent to require-corp even though request credentials and compatibility differ.
securityConsiderations: COEP strengthens isolation around embedded resources, but it does not make untrusted resource content safe or replace CSP and integrity checks.
relatedHeaders:
  - cross-origin-opener-policy
  - cross-origin-resource-policy
  - access-control-allow-origin
references:
  - label: HTML Standard Cross-Origin-Embedder-Policy
    url: https://html.spec.whatwg.org/multipage/browsers.html#the-cross-origin-embedder-policy-http-response-header
  - label: MDN Cross-Origin-Embedder-Policy
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy
---
## Meaning and behavior

Cross-Origin-Embedder-Policy, or COEP, changes which cross-origin resources a document may embed. Under `require-corp`, a no-CORS cross-origin response must grant permission through Cross-Origin-Resource-Policy, while a resource loaded in CORS mode must satisfy CORS. This prevents a document from freely incorporating opaque responses that did not opt into the relationship. A compatible COEP combined with Cross-Origin-Opener-Policy can make the page cross-origin isolated and unlock browser features that require a stronger process boundary.

The `credentialless` value takes a different approach for no-CORS cross-origin requests: credentials are omitted, allowing some resources to load without a CORP header. It is not a spelling variant of `require-corp`; request cookies, authentication, cache behavior, support, and privacy properties differ. `unsafe-none` leaves the default embedding behavior. COEP governs loading permission and does not declare that the bytes returned by an allowed resource are trustworthy.

## Implementation notes

Inventory every image, font, script, worker, media file, iframe dependency, and indirect third-party request before rollout. For resources you control, choose CORS or a suitable CORP policy intentionally. For external resources, confirm support rather than assuming that a successful direct navigation proves embed compatibility. Test signed-in and signed-out states because credentials can change results. Use browser console diagnostics and the `crossOriginIsolated` property to verify the complete policy set. Keep CSP source restrictions and subresource integrity where appropriate; COEP addresses a different boundary and does not replace them.
