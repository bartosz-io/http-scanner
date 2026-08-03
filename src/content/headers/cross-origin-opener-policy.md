---
headerName: cross-origin-opener-policy
description: Cross-Origin-Opener-Policy separates top-level browsing contexts from incompatible cross-origin windows to strengthen document isolation boundaries.
applicability: response
syntax: "Cross-Origin-Opener-Policy: unsafe-none | same-origin-allow-popups | same-origin | noopener-allow-popups"
examples:
  - "Cross-Origin-Opener-Policy: same-origin"
useCases:
  - Isolate a web application from unrelated cross-origin opener relationships.
  - Satisfy part of the browser requirements for cross-origin isolated capabilities.
commonMistakes:
  - Enabling same-origin without testing OAuth, payment, or support flows that depend on popup communication.
  - Assuming opener isolation controls resource embedding or substitutes for Cross-Origin-Embedder-Policy.
securityConsiderations: COOP reduces cross-window attack surface and process sharing, but application messaging, authorization, and navigation validation still require explicit controls.
relatedHeaders:
  - cross-origin-embedder-policy
  - cross-origin-resource-policy
  - content-security-policy
references:
  - label: HTML Standard cross-origin opener policies
    url: https://html.spec.whatwg.org/multipage/browsers.html#cross-origin-opener-policies
  - label: MDN Cross-Origin-Opener-Policy
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy
---
## Meaning and behavior

Cross-Origin-Opener-Policy, or COOP, controls whether a top-level document can share a browsing context group with windows that have incompatible origins and policies. With `same-origin`, a cross-origin opener or opened page is placed in a different group, severing the normal `window.opener` relationship across that boundary. This isolation helps prevent classes of cross-window information exposure and is one ingredient, together with a compatible Cross-Origin-Embedder-Policy, for a cross-origin isolated environment.

COOP is not a rule for fetching scripts, images, or frames. It concerns top-level browsing contexts and opener relationships. `same-origin-allow-popups` keeps certain popups in the group, which can preserve integrations, but provides different isolation guarantees. `unsafe-none` is the permissive default. Browsing context group changes can make a WindowProxy appear closed to code that previously communicated with a popup, even though the separate window remains visible to the user.

## Implementation notes

Map every popup and opener flow before deployment. Authentication providers, payment windows, document previews, customer support tools, and test harnesses commonly exchange status through `window.opener` or `postMessage`. Deploy COOP on all relevant document responses, including errors and redirects that can become the final page. Test direct navigation, opening and being opened, back navigation, and cross-origin isolation indicators. When popup compatibility is required, evaluate `same-origin-allow-popups` against the exact threat model instead of weakening policy accidentally. Pairing COOP with COEP requires every embedded dependency to satisfy the COEP loading rules.
