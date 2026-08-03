---
headerName: origin-agent-cluster
description: Origin-Agent-Cluster requests an origin-keyed browser agent cluster so documents from different origins are less likely to share execution resources.
applicability: response
syntax: "Origin-Agent-Cluster: ?1"
examples:
  - "Origin-Agent-Cluster: ?1"
useCases:
  - Request origin-level process and memory isolation instead of broader site-keyed grouping.
  - Prepare an application to avoid synchronous assumptions across same-site cross-origin documents.
commonMistakes:
  - Treating process isolation as an authorization boundary or defense against all side channels.
  - Sending conflicting policy across pages of the same origin and expecting deterministic late changes.
securityConsiderations: Origin-keyed clustering can reduce shared execution surface, but browser allocation is implementation-dependent and normal web security controls remain essential.
relatedHeaders:
  - cross-origin-opener-policy
  - cross-origin-embedder-policy
  - content-security-policy
references:
  - label: HTML Standard origin-keyed agent clusters
    url: https://html.spec.whatwg.org/multipage/origin.html#origin-keyed-agent-clusters
  - label: MDN Origin-Agent-Cluster
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin-Agent-Cluster
---
## Meaning and behavior

Origin-Agent-Cluster with the structured boolean value `?1` asks the browser to place the response origin in an origin-keyed agent cluster. Agent clusters determine which documents can share certain execution resources and synchronous capabilities. Historically, compatible origins within one site could be grouped more broadly. Origin-keying narrows that grouping and can encourage stronger process separation between sibling origins, although a browser remains free to manage processes according to resource and platform constraints.

The header is a request about isolation architecture, not an access-control decision. It does not grant or deny network requests, protect an endpoint, sanitize messages, or guarantee a dedicated operating-system process. It can also affect legacy assumptions involving `document.domain`, because origin-keyed documents cannot use that mechanism to relax origins in the same way. Policy is associated with the origin, so inconsistent delivery can produce warnings or behavior determined by the first applicable navigation.

## Implementation notes

Audit any use of `document.domain`, synchronous cross-origin window access, and same-site legacy integrations before enabling the field. Deliver `?1` consistently on every document response for the origin, including errors and alternate routes. Test popup, iframe, worker, and messaging behavior in supported browsers. Measure memory and process implications for applications with many subdomains, but do not infer security guarantees from a process count. Keep COOP, COEP, CSP, CORS, and application authorization configured according to their own purposes. The header can strengthen isolation posture, yet it is only one signal within the browser's broader agent-cluster model.
