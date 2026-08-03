---
headerName: via
description: Via records HTTP protocol information about forwarding proxies and gateways that handled a request or response along its delivery path.
applicability: request-and-response
syntax: "Via: <received-protocol> <received-by>[, ...]"
examples:
  - "Via: 1.1 proxy.example"
  - "Via: 1.0 edge-a, 1.1 gateway-b"
useCases:
  - Diagnose loops and protocol transitions across cooperating intermediaries.
  - Identify which gateway path processed a response without exposing unnecessary internal detail.
commonMistakes:
  - Treating Via as a general server product banner rather than intermediary trace metadata.
  - Removing required forwarding information without considering loop detection and organizational privacy rules.
securityConsiderations: Via can expose network topology, so pseudonyms and careful detail are appropriate, while protocol compliance and loop prevention must be preserved.
relatedHeaders:
  - server
  - x-powered-by
  - age
references:
  - label: RFC 9110 Via field
    url: https://www.rfc-editor.org/rfc/rfc9110#name-via
  - label: MDN Via
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Via
---
## Meaning and behavior

Via is a standard HTTP field added by forwarding proxies and gateways to describe protocol handling along a message path. Each entry contains a received protocol version and an identifier for the intermediary, optionally with a comment. Entries are ordered as the message travels, allowing recipients and intermediaries to recognize forwarding chains and diagnose loops. The identifier may be a host, port, or pseudonym when revealing an internal address would be inappropriate.

Via is not the same as Server. Server describes software associated with an origin response, while Via records forwarding participants and protocol versions. It also is not a complete network trace: organizations can combine entries under defined conditions, use pseudonyms, and hide details for privacy. Different scanner locations may traverse different edges and therefore observe different values.

## Implementation notes

Configure forwarding components according to RFC 9110 and the organization's disclosure policy. Preserve enough information for loop detection and protocol diagnostics, but avoid comments containing product versions, private hostnames, or environment names unless they are operationally necessary. Test multi-proxy routes, retries, cached responses, WebSocket or upgrade paths, and error generation. If a gateway strips upstream Via entries, confirm that doing so does not violate interoperability expectations or hide a routing loop. Correlate the field with internal traces rather than treating public identifiers as authoritative topology. Review both requests and responses because Via can appear in either direction.
