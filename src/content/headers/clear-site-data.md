---
headerName: clear-site-data
description: Clear-Site-Data instructs a browser to remove selected categories of stored data associated with the response origin after a secure response.
applicability: response
syntax: "Clear-Site-Data: \"cache\", \"cookies\", \"storage\""
examples:
  - "Clear-Site-Data: \"cache\", \"cookies\", \"storage\""
useCases:
  - Remove browser state after account logout or a security-sensitive reset.
  - Recover from an application release that stored incompatible or compromised local data.
commonMistakes:
  - Sending the field on routine responses and unexpectedly destroying active user state.
  - Assuming data removal is synchronous, universal, or a substitute for server-side session revocation.
securityConsiderations: The field is intentionally destructive and must be emitted only from trusted secure flows; server credentials and sessions still need independent invalidation.
relatedHeaders:
  - set-cookie
  - cache-control
  - strict-transport-security
references:
  - label: W3C Clear Site Data
    url: https://www.w3.org/TR/clear-site-data/
  - label: MDN Clear-Site-Data
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data
---
## Meaning and behavior

Clear-Site-Data asks a supporting browser to clear named classes of data associated with the origin that delivered the response. Quoted directives include `"cache"`, `"cookies"`, and `"storage"`; the wildcard directive requests all supported categories. The operation can affect HTTP cache entries, cookies, local storage, IndexedDB, service worker registrations, and other state according to the selected directives and browser implementation. Because clearing can span several subsystems, the effect is not equivalent to deleting one cookie or returning a no-store cache directive.

Browsers require a secure context for the field's destructive behavior. Processing and completion details vary, and unsupported storage mechanisms or browser versions may leave data behind. Clearing browser cookies also does not revoke a bearer token already copied elsewhere or invalidate a server-side session record. A logout response therefore needs server-side invalidation first, followed by narrowly chosen browser cleanup.

## Implementation notes

Emit Clear-Site-Data only from explicit, protected workflows such as logout, account recovery, or incident remediation. Decide which categories are necessary instead of using the wildcard reflexively. Ensure the response is delivered over HTTPS and cannot be triggered cross-site without the application's normal request protections. Test with realistic service workers, multiple tabs, persistent storage, and browser restart behavior. Communicate that local offline data may be lost. For cookie cleanup, also expire application cookies with correct domain and path attributes. Monitor support and avoid assuming a header observation proves every asynchronous deletion completed.
