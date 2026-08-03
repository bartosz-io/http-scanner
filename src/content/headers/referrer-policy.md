---
headerName: referrer-policy
description: Referrer-Policy controls how much source URL information a browser includes when navigating or requesting resources from another context.
applicability: response
syntax: "Referrer-Policy: <policy-token>"
examples:
  - "Referrer-Policy: strict-origin-when-cross-origin"
  - "Referrer-Policy: no-referrer"
useCases:
  - Send only the origin on cross-origin HTTPS requests while retaining useful same-origin diagnostics.
  - Suppress referrer information entirely for pages with highly sensitive URL paths or queries.
commonMistakes:
  - Assuming origin-only policy removes sensitive data already placed in the origin or destination URL.
  - Choosing unsafe-url for analytics convenience and exposing full paths across origins.
securityConsiderations: A restrictive policy reduces accidental URL disclosure, but sensitive credentials and personal data should never be placed in URLs in the first place.
relatedHeaders:
  - content-security-policy
  - permissions-policy
  - location
references:
  - label: W3C Referrer Policy
    url: https://www.w3.org/TR/referrer-policy/
  - label: MDN Referrer-Policy
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy
---
## Meaning and behavior

Referrer-Policy selects the information used to create the Referer request field for navigations and subresource requests initiated by a document. The deliberately misspelled request field name is historical; the policy header uses the correctly spelled word. Policies distinguish a full referrer URL from an origin-only value and account for same-origin, cross-origin, and security downgrade transitions. `strict-origin-when-cross-origin`, a common balanced choice, keeps the full URL for same-origin requests, sends only the origin for secure cross-origin requests, and sends no referrer when moving from HTTPS to HTTP.

More restrictive values include `no-referrer`, which omits the field, and `same-origin`, which suppresses it for cross-origin requests. `unsafe-url` can send a full URL broadly and therefore deserves careful scrutiny. Fragment identifiers and credentials are excluded by the algorithm, but paths and query strings can still contain revealing information. Policy affects browser-generated referrers; it does not redact application logs, destination URLs, analytics parameters, or data explicitly sent by script.

## Implementation notes

Choose a policy from a data-flow inventory rather than copying a token without testing. Search application URLs for account identifiers, search terms, invitation codes, and other sensitive values. Prefer moving those values out of URLs even when a strict policy is present. Apply the response header consistently and check whether individual HTML elements or nested contexts intentionally override it. Exercise same-origin links, external links, images, APIs, and HTTPS-to-HTTP transitions in browser developer tools. Confirm that third-party integrations do not depend on full referrer paths before tightening production behavior.
