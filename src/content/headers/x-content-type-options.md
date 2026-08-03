---
headerName: x-content-type-options
description: X-Content-Type-Options with nosniff asks browsers to respect declared media types for script and style destinations instead of guessing.
applicability: response
syntax: "X-Content-Type-Options: nosniff"
examples:
  - "X-Content-Type-Options: nosniff"
useCases:
  - Prevent a mislabeled response from being accepted as an executable script or stylesheet.
  - Make incorrect Content-Type configuration fail visibly instead of relying on browser sniffing.
commonMistakes:
  - Sending nosniff while continuing to label JavaScript or CSS with an incompatible media type.
  - Assuming the field validates uploaded content or replaces server-side type checks.
securityConsiderations: Nosniff closes important type-confusion paths for protected destinations, but correct Content-Type values and safe upload handling remain necessary.
relatedHeaders:
  - content-type
  - content-security-policy
  - content-disposition
references:
  - label: Fetch Standard nosniff response
    url: https://fetch.spec.whatwg.org/#x-content-type-options-header
  - label: MDN X-Content-Type-Options
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
---
## Meaning and behavior

X-Content-Type-Options has one standardized value, `nosniff`. In the Fetch processing model it prevents browsers from accepting certain script and style responses when their declared media type is not compatible with the request destination. This matters because historical MIME sniffing could reinterpret bytes according to their apparent content rather than the server's `Content-Type`, creating opportunities for an attacker-controlled response to become executable. The field is therefore a directive about browser interpretation, not a declaration of the actual representation format.

Nosniff does not correct a wrong `Content-Type`. If a JavaScript resource is returned as `text/plain`, enabling the field can cause the resource to stop loading, which is the intended safe failure. It also does not inspect file uploads, sanitize HTML, or guarantee that every browser context avoids all content sniffing. The server still needs to select accurate media types and prevent user-controlled data from being served from executable or trusted origins in dangerous contexts.

## Implementation notes

Emit the exact value `nosniff` consistently on application, asset, error, and download responses. Before rollout, inventory scripts and styles and verify that their `Content-Type` values are correct. Pay particular attention to object storage, CDNs, fallback routes, and dynamically generated assets, where metadata often differs from the main application. Test actual browser loading rather than checking only that the field exists. For downloads, combine accurate media types with an appropriate Content-Disposition policy. A scanner can identify the field and value, while browser console errors reveal resources rejected because of incompatible labeling.
