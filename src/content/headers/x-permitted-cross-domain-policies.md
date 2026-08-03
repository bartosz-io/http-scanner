---
headerName: x-permitted-cross-domain-policies
description: X-Permitted-Cross-Domain-Policies controls whether legacy Adobe clients may use cross-domain policy files exposed by the response host.
applicability: response
syntax: "X-Permitted-Cross-Domain-Policies: none | master-only | by-content-type | by-ftp-filename | all"
examples:
  - "X-Permitted-Cross-Domain-Policies: none"
useCases:
  - Disable legacy Adobe cross-domain policy discovery on a host that does not require it.
  - Constrain an unavoidable legacy integration to an explicitly selected policy mode.
commonMistakes:
  - Assuming the field controls modern browser CORS or iframe embedding.
  - Adding none while leaving a legacy integration dependent on a crossdomain.xml policy file.
securityConsiderations: Disabling unused legacy policy mechanisms reduces unexpected data access paths, but modern browser access still depends on CORS and other current controls.
relatedHeaders:
  - access-control-allow-origin
  - content-security-policy
  - cross-origin-resource-policy
references:
  - label: Adobe cross-domain configuration
    url: https://www.adobe.com/devnet-docs/acrobatetk/tools/AppSec/xdomain.html
  - label: MDN X-Permitted-Cross-Domain-Policies
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Permitted-Cross-Domain-Policies
---
## Meaning and behavior

X-Permitted-Cross-Domain-Policies is a non-standard compatibility header associated with legacy Adobe products and their cross-domain policy-file mechanism. A value of `none` instructs participating clients not to grant access through those policy files. Other historical values allow specific discovery or policy locations, with `all` being the broadest. The field arose before modern web CORS and is not interpreted as a CORS response header by current browser Fetch implementations.

Its relevance depends on the software consuming the response. Many modern applications have no Adobe client requirement and can use `none` as defense in depth, especially when legacy policy files might remain on a shared host. However, the field does not delete `crossdomain.xml`, cannot repair an overly permissive legacy policy by itself in every client, and does not affect normal JavaScript origin checks, framing, or server authorization. Behavior is implementation-specific and support is concentrated in legacy technology.

## Implementation notes

Search the web root, storage buckets, and historical deployment artifacts for `crossdomain.xml` and related policy files. Confirm with application owners that no supported client depends on them. If the mechanism is unused, remove the files and emit `none` consistently. If a legacy dependency remains, document the exact client and choose the narrowest compatible value after testing. Review modern CORS separately because its headers and threat model are different. Treat scanner detection as evidence of the response value only; it cannot establish which obsolete clients still operate in a user's environment.
