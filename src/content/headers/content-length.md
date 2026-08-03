---
headerName: content-length
description: Content-Length states the decimal number of octets in the message content when HTTP framing permits the sender to know and declare that size.
applicability: request-and-response
syntax: "Content-Length: <decimal octet count>"
examples:
  - "Content-Length: 348"
useCases:
  - Declare the exact size of a fixed response body for progress and framing decisions.
  - Describe an empty body explicitly with a value of zero where the message semantics permit it.
commonMistakes:
  - Calculating characters instead of encoded octets or measuring content before compression is applied.
  - Sending a value that disagrees with transfer framing or with another Content-Length field.
securityConsiderations: Conflicting or incorrect message lengths can cause request smuggling, response splitting, truncation, or cache poisoning across components that parse framing differently.
relatedHeaders:
  - content-encoding
  - content-type
  - accept-ranges
references:
  - label: RFC 9110 Content-Length
    url: https://www.rfc-editor.org/rfc/rfc9110#name-content-length
  - label: MDN Content-Length
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Length
---
## Meaning and behavior

Content-Length is a decimal count of octets in the message content as transmitted for the applicable message. It is not a count of Unicode characters, source file units, or the uncompressed representation. When Content-Encoding compresses a response before transmission, the declared length corresponds to the encoded bytes carried in that message. HTTP versions and message semantics determine when the field provides framing and when other mechanisms or known semantics delimit content.

The field can be absent legitimately. A server may stream content without knowing its final length, an HTTP/1.1 message may use chunked transfer coding, and HTTP/2 or HTTP/3 framing supplies message boundaries independently. Some responses, such as those to HEAD, have special rules about what a declared length represents. Duplicate or contradictory values are dangerous because different intermediaries might disagree about where one message ends.

## Implementation notes

Let a mature server or framework calculate Content-Length after all representation transformations whenever possible. Do not copy an origin length through a proxy that decompresses, recompresses, truncates, or otherwise changes content. Test multibyte text, compression, empty responses, HEAD, range responses, streaming, and error paths. Reject ambiguous incoming framing at trusted boundaries and keep all HTTP parsers patched and consistently configured. When debugging a mismatch, compare raw transmitted octets rather than decoded text. An absent field on a valid streamed response is not itself an error; accuracy and unambiguous framing matter more than universal presence.
