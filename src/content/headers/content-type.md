---
headerName: content-type
description: Content-Type identifies the media type and optional parameters of the selected representation so recipients know how its bytes should be interpreted.
applicability: request-and-response
syntax: "Content-Type: <type>/<subtype>[; <parameter>=<value>]"
examples:
  - "Content-Type: text/html; charset=utf-8"
  - "Content-Type: application/json"
useCases:
  - Label HTML, JSON, images, fonts, and other representations with their registered media type.
  - Declare a character encoding parameter where the media type permits or requires one.
commonMistakes:
  - Sending every response as application/octet-stream or text/plain regardless of its actual format.
  - Relying on browser sniffing instead of declaring an accurate media type and charset.
securityConsiderations: Incorrect media types can enable content confusion or execution in an unintended context, especially without X-Content-Type-Options nosniff.
relatedHeaders:
  - x-content-type-options
  - content-encoding
  - content-disposition
references:
  - label: RFC 9110 Content-Type
    url: https://www.rfc-editor.org/rfc/rfc9110#name-content-type
  - label: RFC 6838 media type specifications
    url: https://www.rfc-editor.org/rfc/rfc6838
  - label: MDN Content-Type
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type
---
## Meaning and behavior

Content-Type describes the media type of the representation enclosed in an HTTP message. The type and subtype, such as `text/html` or `application/json`, tell a recipient which processing model applies. Parameters refine that description. For text formats, `charset=utf-8` can identify the character encoding where defined by the media type. Parameters are part of the media type value; they are not separate response fields and should be serialized with valid quoting when necessary.

The field describes representation data after any content coding is decoded. Content-Encoding therefore has a distinct role: `br` can compress an HTML representation whose Content-Type remains `text/html`. Browsers have historically sniffed apparent types when metadata was absent or wrong, but sniffing is not a safe substitute for accurate server configuration. `X-Content-Type-Options: nosniff` intentionally makes some wrong script and style labels fail.

## Implementation notes

Map every generated and static format to a registered or appropriate vendor media type. Configure object storage metadata, CDN overrides, error handlers, uploads, and fallback routes as carefully as the main application. Include a charset only where its meaning is defined and ensure the bytes use that encoding. Test downloads and inline rendering in browsers, API clients, and caches. For user-controlled files, validate content and serve it from an appropriate trust boundary; changing the label alone does not make malicious bytes safe. Inspect final responses after compression and proxy transformations, because intermediaries can rewrite metadata.
