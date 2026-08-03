---
headerName: accept-ranges
description: Accept-Ranges advertises whether an origin supports range requests for a selected representation and names the available range unit, commonly bytes.
applicability: response
syntax: "Accept-Ranges: bytes | none | <range-unit>"
examples:
  - "Accept-Ranges: bytes"
  - "Accept-Ranges: none"
useCases:
  - Advertise byte-range support for large media, archives, or resumable downloads.
  - State that a resource does not support range processing even if a client might attempt it.
commonMistakes:
  - Advertising bytes while ignoring Range or returning incorrect Content-Range boundaries.
  - Assuming the field is required before a client is allowed to send a Range request.
securityConsiderations: Range processing must validate bounds and limit multipart amplification to avoid excessive CPU, memory, bandwidth, or cache inconsistency.
relatedHeaders:
  - content-length
  - etag
  - last-modified
references:
  - label: RFC 9110 Range Requests
    url: https://www.rfc-editor.org/rfc/rfc9110#name-range-requests
  - label: MDN Accept-Ranges
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Ranges
---
## Meaning and behavior

Accept-Ranges tells a recipient which range unit an origin supports for the selected representation. `bytes` advertises byte ranges, enabling clients to request only part of a resource for resume, seeking, or parallel retrieval. `none` communicates that range requests are not supported. The field is advisory: a client can send Range without previously seeing Accept-Ranges, and the server's actual response determines whether the request was honored.

A successful single range generally produces status 206 and Content-Range metadata, while an unsatisfiable range produces 416 with appropriate information. A server can ignore Range and return the complete representation with 200. Validators matter because If-Range lets a client request a partial response only if its stored representation is still current. Compression and transformations complicate which byte sequence ranges address.

## Implementation notes

Advertise `bytes` only when every serving layer implements consistent range semantics for the transmitted representation. Validate start and end positions, integer overflow, overlapping ranges, and excessive multipart requests. Set Content-Length and Content-Range accurately for partial responses. Test files at boundaries, empty resources, stale ETags, Last-Modified validators, compression, CDN caching, and resumed downloads. Apply limits to prevent many tiny or overlapping ranges from amplifying work. If a proxy handles ranges, ensure origin and edge agree; inconsistent support can corrupt downloads or poison cached variants. Use `none` or omit advertising when correct support is unavailable.
