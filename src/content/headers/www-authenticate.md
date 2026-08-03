---
headerName: www-authenticate
description: WWW-Authenticate presents one or more authentication challenges describing schemes and parameters a client may use for the requested resource.
applicability: response
syntax: "WWW-Authenticate: <scheme> [<authentication-parameters>]"
examples:
  - "WWW-Authenticate: Bearer realm=\"api\", error=\"invalid_token\""
  - "WWW-Authenticate: Basic realm=\"admin\", charset=\"UTF-8\""
useCases:
  - Challenge an API client for a Bearer access token with an appropriate realm.
  - Advertise a supported HTTP authentication scheme after a 401 response.
commonMistakes:
  - Returning 401 without a usable challenge or placing credentials themselves in the response field.
  - Exposing detailed token-validation or account information that helps enumerate users or security state.
securityConsiderations: Challenges guide authentication but do not secure credentials in transit; use HTTPS, validate the chosen scheme rigorously, and keep error detail minimal.
relatedHeaders:
  - set-cookie
  - access-control-allow-credentials
  - cache-control
references:
  - label: RFC 9110 WWW-Authenticate
    url: https://www.rfc-editor.org/rfc/rfc9110#name-www-authenticate
  - label: RFC 6750 Bearer token usage
    url: https://www.rfc-editor.org/rfc/rfc6750
  - label: MDN WWW-Authenticate
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate
---
## Meaning and behavior

WWW-Authenticate carries authentication challenges from a server to a client. A challenge begins with a registered scheme such as Basic or Bearer and includes scheme-defined parameters. A `realm` can describe the protection space. Bearer challenges can include standardized error information, while other schemes define nonces, algorithms, or additional negotiation data. A 401 response is normally accompanied by at least one applicable challenge so the client knows how it may authenticate.

The field does not contain the client's credentials and does not prove that a later Authorization value is valid. Challenge parsing is scheme-specific, and several challenges can appear in one response according to HTTP list rules. Browsers and API clients differ in which schemes they handle automatically. CORS credential permission is a separate browser exposure concern; it does not replace authentication or authorize a principal.

## Implementation notes

Choose schemes appropriate for the environment and require HTTPS before credentials or bearer tokens are sent. Construct challenges with correct quoting and avoid detailed reasons that reveal whether an account, token, tenant, or scope exists. For Bearer APIs, follow RFC 6750 error semantics and cache rules. Test missing, expired, malformed, and insufficient credentials, plus clients receiving multiple challenges. Keep 401 for absent or invalid authentication and use authorization responses consistently after identity is established. Review reverse proxies because they can add their own challenge or intercept origin responses. Do not expose secrets, raw validation exceptions, or internal key identifiers in challenge parameters.
