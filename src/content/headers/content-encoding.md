---
headerName: content-encoding
description: Content-Encoding lists representation codings such as br or gzip that must be decoded to recover the media type identified by Content-Type.
applicability: request-and-response
syntax: "Content-Encoding: <coding>[, <coding>...]"
examples:
  - "Content-Encoding: br"
  - "Content-Encoding: gzip"
useCases:
  - Compress a text representation to reduce transferred bytes while preserving its original media type.
  - Identify multiple representation codings in the order in which they were applied.
commonMistakes:
  - Confusing representation coding with HTTP transfer framing or a file's intrinsic media format.
  - Reusing one cached encoded response for clients whose Accept-Encoding capabilities differ.
securityConsiderations: Compression can amplify resource use or expose length-based side channels when secrets and attacker-controlled input share a compressed context.
relatedHeaders:
  - content-type
  - content-length
  - vary
references:
  - label: RFC 9110 Content-Encoding
    url: https://www.rfc-editor.org/rfc/rfc9110#name-content-encoding
  - label: MDN Content-Encoding
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding
---
## Meaning and behavior

Content-Encoding names representation codings applied to data beyond the media type's inherent format. A recipient reverses those codings to obtain the representation described by Content-Type. `gzip` and `br` are common compression codings. If several codings are listed, their order records the order of application, allowing the recipient to decode in reverse. The field does not change `text/css` into a different media type; it explains an additional encoding layer around those bytes.

Content coding is different from transfer coding. Transfer framing helps move a message between HTTP participants and can be removed by each hop, whereas Content-Encoding is representation metadata and generally remains until the representation is decoded or transformed. Content negotiation often selects an encoding from Accept-Encoding. Caches need a consistent key, commonly expressed with `Vary: Accept-Encoding`, so a browser that lacks Brotli support does not receive Brotli bytes.

## Implementation notes

Configure compression only for formats and sizes that benefit, and avoid repeatedly compressing already compressed images or archives. Ensure Content-Length is calculated after coding. If a proxy decompresses or recompresses, it must update Content-Encoding, length, validators, and related metadata coherently. Test multiple client capabilities, range requests, HEAD, caches, and fallback responses. Limit decompression resources to resist archive or compression bombs. For responses mixing secrets with reflected input, consider whether compression length can create a practical side channel. Observe the final edge response because origin and CDN coding choices commonly differ.
