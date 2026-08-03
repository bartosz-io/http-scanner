---
headerName: strict-transport-security
description: Strict-Transport-Security tells supporting browsers to use HTTPS for a host for a declared period and optionally include its subdomains.
applicability: response
syntax: "Strict-Transport-Security: max-age=<seconds>[; includeSubDomains][; preload]"
examples:
  - "Strict-Transport-Security: max-age=31536000; includeSubDomains"
useCases:
  - Prevent later HTTP navigations from leaving the browser before they are upgraded to HTTPS.
  - Apply an HTTPS-only policy consistently across a host and prepared subdomains.
commonMistakes:
  - Sending the field only over HTTP, where browsers must ignore it.
  - Enabling includeSubDomains or preload before every affected subdomain supports HTTPS correctly.
securityConsiderations: HSTS reduces downgrade and cookie exposure risks after policy acquisition, but the first visit remains exposed unless preload or another trusted path applies.
relatedHeaders:
  - content-security-policy
  - set-cookie
  - location
references:
  - label: RFC 6797 HTTP Strict Transport Security
    url: https://www.rfc-editor.org/rfc/rfc6797
  - label: MDN Strict-Transport-Security
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
---
## Meaning and behavior

Strict-Transport-Security, or HSTS, records an HTTPS-only policy in a user agent for the response host. `max-age` is the number of seconds for which the browser remembers the policy. While it is active, an attempted HTTP navigation to that host is internally upgraded to HTTPS before a network request is sent, and certificate errors are not offered a normal click-through. `includeSubDomains` extends the policy to subdomains. It does not merely describe the current connection; it changes how qualifying future requests are handled.

Browsers process HSTS only when it arrives over an error-free secure connection. A copy delivered over HTTP is ignored because an attacker able to alter that response could otherwise create or remove policy. This also means HSTS does not inherently protect a user's very first visit. Browser preload lists can close that gap, but preload is an external, long-lived commitment with additional requirements and removal delay. The `preload` token itself does not enroll a domain automatically.

## Implementation notes

Confirm that the main host and every host covered by `includeSubDomains` serves valid HTTPS before increasing `max-age`. Begin with a short duration, monitor failures, and increase it gradually. Keep HTTP redirects for clients that do not yet know the policy, but do not treat redirects as equivalent protection. Review cookie `Secure` attributes separately because HSTS does not rewrite cookie definitions. If pursuing preload, follow the browser program's current eligibility process and understand operational recovery. Verify the header on final HTTPS responses across routes, not only on the home page.
