---
headerName: access-control-expose-headers
description: Access-Control-Expose-Headers expands the response field names that browser scripts may read from a successful cross-origin response.
applicability: response
syntax: "Access-Control-Expose-Headers: <response-header-name>[, ...]"
examples:
  - "Access-Control-Expose-Headers: ETag, Content-Disposition, X-Request-ID"
useCases:
  - Let browser code read ETag for application-level concurrency or cache behavior.
  - Expose safe download metadata such as Content-Disposition to an approved cross-origin application.
commonMistakes:
  - Using it to permit request fields instead of Access-Control-Allow-Headers.
  - Exposing internal diagnostics, identifiers, or infrastructure metadata that browser code does not need.
securityConsiderations: Exposed fields become readable by permitted origins and can reveal identifiers, timing, topology, or sensitive operational detail beyond the response body.
relatedHeaders:
  - access-control-allow-origin
  - access-control-allow-headers
  - etag
references:
  - label: Fetch Standard CORS protocol headers
    url: https://fetch.spec.whatwg.org/#http-new-header-syntax
  - label: MDN Access-Control-Expose-Headers
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers
---
## Meaning and behavior

Access-Control-Expose-Headers lists response field names that browser script may read beyond the CORS-safelisted response fields. A cross-origin fetch can succeed at the network and CORS levels while JavaScript still sees only a limited metadata set. Exposing `ETag` or `Content-Disposition` makes those selected values available through response header APIs. This field affects response visibility; it does not permit the client to send similarly named request fields.

The exposure takes effect only as part of a successful CORS exchange with a permitted origin. It does not make a denied response readable, authenticate the script, or prevent the request from reaching the server. Wildcard behavior depends on credentials mode under Fetch rules, so an explicit bounded list is often clearer for credentialed APIs. The response body and exposed metadata should be reviewed together because a seemingly harmless identifier can enable correlation.

## Implementation notes

Inventory exactly which response metadata the browser application consumes. Expose only those names and avoid server versions, internal trace topology, debug data, rate-limit keys tied to identity, or sensitive filenames. Test actual JavaScript access from allowed and denied origins, with and without credentials. Verify casing and duplicate behavior through proxies. Keep Access-Control-Allow-Headers separate for request permission. When an application stops using a field, remove it from the exposure list. Remember that non-browser clients can already read ordinary HTTP response fields, so this policy is specifically about the browser CORS boundary rather than universal secrecy.
