---
headerName: etag
description: ETag identifies a selected representation version so clients and caches can make conditional requests and avoid retransmitting unchanged content.
applicability: response
syntax: "ETag: [W/]\"<opaque-tag>\""
examples:
  - "ETag: \"abc123\""
  - "ETag: W/\"revision-42\""
useCases:
  - Revalidate a cached representation with If-None-Match and return 304 when unchanged.
  - Protect a state-changing request from overwriting a different current version with If-Match.
commonMistakes:
  - Treating weak and strong validators as interchangeable for byte-range or exact representation comparisons.
  - Generating user-specific tags from sensitive identifiers that leak stable cross-context information.
securityConsiderations: Validators can enable tracking or expose implementation detail if derived carelessly; they must also vary whenever security-relevant representation bytes vary.
relatedHeaders:
  - cache-control
  - last-modified
  - vary
  - content-encoding
references:
  - label: RFC 9110 ETag field
    url: https://www.rfc-editor.org/rfc/rfc9110#name-etag
  - label: MDN ETag
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
---
## Meaning and behavior

ETag carries an opaque entity tag selected by the origin for a representation. A strong tag changes whenever representation data changes in a way relevant to byte-for-byte comparison. A weak tag begins with `W/` and can remain equal across representations that are semantically equivalent despite minor byte differences. Clients send tags in conditional fields such as If-None-Match to validate a cached response or If-Match to require a current version before an update.

The tag is scoped to the representation selected by the request. Content negotiation, compression, and authorization can produce variants that require distinct validators. ETag does not prescribe a hash, version number, or database identifier, and recipients must treat its opaque value according to comparison rules. A 304 response reuses stored metadata and content; it does not contain the full representation again.

## Implementation notes

Generate stable tags from a representation revision without embedding secrets, usernames, infrastructure paths, or guessable sensitive identifiers. Decide whether strong semantics are truly available; dynamic compression and transformations can make weak tags more honest. Ensure variants selected by Vary do not accidentally share an incompatible tag. Test GET and HEAD revalidation, 304 metadata, range requests, and write preconditions. Pair validators with a deliberate Cache-Control policy, since an ETag alone does not define freshness. For personalized content, verify isolation between users and consider tracking implications of long-lived unique tags.
