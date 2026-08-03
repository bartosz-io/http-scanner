---
headerName: content-security-policy
description: Content-Security-Policy defines which sources a browser may use for scripts, styles, frames, images, and other protected resource types.
applicability: response
syntax: "Content-Security-Policy: <directive> <source-list>; ..."
examples:
  - "Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'"
  - "Content-Security-Policy: script-src 'self' 'nonce-r4nd0m'; frame-ancestors 'none'"
useCases:
  - Restrict executable content to explicitly trusted origins or nonce-bearing inline blocks.
  - Prevent framing and reduce the impact of markup injection in a web application.
commonMistakes:
  - Adding unsafe-inline or broad wildcards until the policy no longer provides meaningful restriction.
  - Confusing Content-Security-Policy-Report-Only telemetry with an enforcing policy.
securityConsiderations: A carefully tested policy limits useful injection primitives, but it complements rather than replaces output encoding and safe DOM APIs.
relatedHeaders:
  - x-content-type-options
  - x-frame-options
  - cross-origin-opener-policy
references:
  - label: W3C Content Security Policy Level 3
    url: https://www.w3.org/TR/CSP3/
  - label: MDN Content-Security-Policy
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
---
## Meaning and behavior

Content-Security-Policy, usually shortened to CSP, supplies a set of directives that a browser evaluates while loading and executing a document. Each directive governs a specific capability. For example, `script-src` controls script execution sources, `img-src` controls image requests, and `frame-ancestors` controls which documents may embed the response. `default-src` is a fallback for several fetch directives, but it does not replace directives such as `base-uri` or `frame-ancestors`. Source expressions also have precise meanings: `'self'` identifies the protected resource's origin, a nonce authorizes matching inline content, and a host source can constrain scheme, host, and port.

An enforcing Content-Security-Policy blocks operations that violate the effective policy. Content-Security-Policy-Report-Only evaluates a policy and reports violations without blocking them. Report-only deployment is useful for discovery, but its presence is not evidence that attacks are prevented. Multiple policies are combined restrictively rather than treated as alternatives, so adding a second header cannot loosen an existing policy.

## Implementation notes

Start from observed application requirements and reduce permissions deliberately. Prefer nonces or hashes for necessary inline scripts, avoid broad wildcards, and include explicit `object-src` and `base-uri` directives. Roll out a candidate in report-only mode, classify legitimate violations, then deploy enforcement and continue monitoring. Test navigation, authentication, payment, third-party widgets, error pages, and cached responses. A scanner can show the delivered field, but browser developer tools and violation reports are needed to confirm that every route produces the intended effective policy.
