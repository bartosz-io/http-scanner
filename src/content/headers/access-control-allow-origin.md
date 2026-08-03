---
headerName: access-control-allow-origin
description: Access-Control-Allow-Origin identifies the origin whose browser scripts may read a response, or uses a wildcard for eligible non-credentialed access.
applicability: response
syntax: "Access-Control-Allow-Origin: <serialized-origin> | *"
examples:
  - "Access-Control-Allow-Origin: https://app.example"
  - "Access-Control-Allow-Origin: *"
useCases:
  - Allow one trusted web application origin to read an API response through CORS.
  - Publish a non-sensitive, non-credentialed resource for browser scripts from any origin.
commonMistakes:
  - Reflecting any Origin value without validating it against an explicit allowlist.
  - Combining the wildcard with credentialed browser access and expecting the response to be exposed.
securityConsiderations: A permissive value can expose sensitive response data to hostile browser origins, especially when ambient credentials or weak origin validation are involved.
relatedHeaders:
  - access-control-allow-credentials
  - access-control-allow-methods
  - vary
references:
  - label: Fetch Standard CORS protocol
    url: https://fetch.spec.whatwg.org/#http-new-header-syntax
  - label: MDN Access-Control-Allow-Origin
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin
---
## Meaning and behavior

Access-Control-Allow-Origin is the central CORS response field controlling which requesting origin may receive a response through browser script APIs. A serialized origin includes its scheme, host, and port when non-default. The wildcard `*` permits eligible non-credentialed access from any origin. It is not a pattern language: values such as `https://*.example.com` are not standard origin wildcards, and a response cannot list several origins as a comma-separated value.

CORS is enforced by browsers around response exposure. It is not authentication, server authorization, or a network firewall. A cross-origin request, including a simple request, can reach the server even when the response lacks permission and browser script cannot read it. Preflighted requests add an OPTIONS permission check before the actual non-simple operation, but servers must still protect every method against unauthorized callers outside a browser.

## Implementation notes

Maintain an exact allowlist and compare parsed origins, not suffix strings vulnerable to lookalike hosts. When returning a request-specific origin, also send `Vary: Origin` so shared caches do not reuse permission across origins. Use `*` only for data intentionally public without credentials. Test allowed, denied, null, malformed, and attacker-controlled origins plus both simple and preflighted requests. Check redirects, errors, CDN caching, and framework middleware order. If cookies or HTTP authentication are required, coordinate with Access-Control-Allow-Credentials and never treat a successful CORS check as proof the user is authorized.
