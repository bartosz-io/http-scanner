---
headerName: x-dns-prefetch-control
description: X-DNS-Prefetch-Control is a non-standard browser hint that enables or disables speculative DNS resolution for links and referenced hostnames.
applicability: response
syntax: "X-DNS-Prefetch-Control: on | off"
examples:
  - "X-DNS-Prefetch-Control: off"
useCases:
  - Reduce speculative hostname disclosure on pages handling sensitive browsing activity.
  - Re-enable DNS prefetching explicitly where measured navigation performance justifies it.
commonMistakes:
  - Assuming off prevents all DNS requests initiated by actual resources, navigation, or scripts.
  - Confusing DNS prefetch with preconnect, which can also establish transport connections.
securityConsiderations: Disabling speculation can reduce passive DNS privacy leakage, but requested resources and user navigation still reveal their destination hostnames normally.
relatedHeaders:
  - link
  - content-security-policy
  - referrer-policy
references:
  - label: MDN X-DNS-Prefetch-Control
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-DNS-Prefetch-Control
  - label: HTML Standard link type dns-prefetch
    url: https://html.spec.whatwg.org/multipage/links.html#link-type-dns-prefetch
---
## Meaning and behavior

X-DNS-Prefetch-Control is a non-standard response field recognized by some browsers as a preference for speculative DNS resolution. With `off`, the document asks the browser not to resolve likely future hostnames merely because they appear in links or other hints. With `on`, prefetching can be enabled where browser defaults or an ancestor setting would otherwise suppress it. Speculation can reduce latency before a later connection, but it also sends DNS queries for hosts the user has not deliberately visited.

The field does not block DNS resolution required by an actual image, script, API call, navigation, or other network operation. It is also narrower than connection hints such as `preconnect`, which can perform DNS plus transport and security setup. Browser support and heuristics are implementation-specific, and user privacy settings or network policy may override site preferences. The field is therefore a hint, not a reliable firewall or confidentiality boundary.

## Implementation notes

Decide based on the page's privacy sensitivity and measured performance. Pages containing private links, internal hostnames, or user-specific destinations may prefer `off`. Public navigation-heavy pages may benefit from carefully selected explicit resource hints instead of broad speculation. Inspect document markup for `dns-prefetch` and `preconnect` links so the signals do not contradict one another. Test with browser network tooling and a controlled DNS observer when possible. Keep CSP and referrer policy configured independently: CSP governs eligible resource locations, while referrer policy governs request metadata, neither of which is replaced by this hint.
