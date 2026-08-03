---
headerName: x-frame-options
description: X-Frame-Options is a legacy response control that tells browsers whether a document may be embedded in a frame by other pages.
applicability: response
syntax: "X-Frame-Options: DENY | SAMEORIGIN"
examples:
  - "X-Frame-Options: DENY"
  - "X-Frame-Options: SAMEORIGIN"
useCases:
  - Block framing of sensitive pages that never need to appear inside another document.
  - Permit same-origin framing for a legacy application while rejecting cross-origin ancestors.
commonMistakes:
  - Using the obsolete ALLOW-FROM form and expecting consistent browser support.
  - Treating SAMEORIGIN as a flexible partner allowlist instead of using CSP frame-ancestors.
securityConsiderations: Frame restrictions reduce clickjacking opportunities, but they do not replace authorization, anti-CSRF controls, or careful UI design.
relatedHeaders:
  - content-security-policy
  - cross-origin-opener-policy
  - referrer-policy
references:
  - label: HTML Standard X-Frame-Options
    url: https://html.spec.whatwg.org/multipage/document-lifecycle.html#the-x-frame-options-header
  - label: MDN X-Frame-Options
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
---
## Meaning and behavior

X-Frame-Options controls whether a browser should display a document inside a frame, iframe, embed, or object context. `DENY` rejects framing regardless of the ancestor's origin. `SAMEORIGIN` permits framing when the relevant origin check is satisfied for the embedding context. Blocking unexpected framing makes it harder to overlay an invisible or misleading interface over a sensitive application and trick a user into activating controls, a family of attacks commonly called clickjacking.

The field is intentionally limited. It cannot express a modern list of selected partner origins, and the historical `ALLOW-FROM` form is obsolete and inconsistently handled. Content Security Policy's `frame-ancestors` directive is the flexible successor and can name multiple permitted ancestors. When both mechanisms are used, they should express compatible intent. Neither mechanism controls which frames the protected page itself may load; CSP directives such as `frame-src` address that separate direction.

## Implementation notes

Use `DENY` when the page never has a legitimate embedding use case. Use `SAMEORIGIN` only after verifying all same-origin framing flows and recognizing that origin is defined by scheme, host, and port. For selected external embedders, deploy CSP `frame-ancestors` and retain X-Frame-Options only as a legacy fallback where useful. Apply the policy to every sensitive HTML response, including authentication, settings, errors, and alternate render paths. Test with real frames from allowed and disallowed origins. Do not add the field to non-document resources expecting it to provide unrelated protections.
