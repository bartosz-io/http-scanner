---
headerName: permissions-policy
description: Permissions-Policy declares which origins and embedded frames may use selected browser capabilities such as camera, microphone, or geolocation.
applicability: response
syntax: "Permissions-Policy: <feature>=<allowlist>, ..."
examples:
  - "Permissions-Policy: camera=(), geolocation=(self), microphone=(self \"https://meet.example\")"
useCases:
  - Disable powerful features that an application and its embedded content never require.
  - Delegate a specific capability to trusted same-origin or named cross-origin frames.
commonMistakes:
  - Writing an origin allowlist without also configuring the iframe allow attribute needed for delegation.
  - Treating feature policy as user consent or as authorization for server-side resources.
securityConsiderations: Minimizing capability availability limits damage from compromised embedded content, while browser permission prompts and application authorization remain separate controls.
relatedHeaders:
  - content-security-policy
  - cross-origin-embedder-policy
  - referrer-policy
references:
  - label: W3C Permissions Policy
    url: https://www.w3.org/TR/permissions-policy-1/
  - label: MDN Permissions-Policy
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
---
## Meaning and behavior

Permissions-Policy defines an allowlist for each controlled browser feature. A declaration such as `camera=()` disables camera access for the document and its descendants. `geolocation=(self)` allows the feature for the response origin, subject to all other browser checks. Named origins can be added when a cross-origin embedded application genuinely needs a capability. The policy determines whether a feature is available in a document; it does not grant the user's permission automatically, bypass a prompt, or prove that an application is authorized to use resulting data.

Embedded frames add another boundary. A top-level policy establishes the maximum capability that descendants can receive, while an iframe's `allow` attribute participates in delegation. Listing an origin in the response policy without configuring the embedding relationship can leave a frame unable to use the feature. Conversely, a permissive iframe attribute cannot exceed restrictions imposed by an ancestor policy. Feature names and browser support evolve, so unknown directives may be ignored rather than providing a universal failure mode.

## Implementation notes

Inventory browser features used by the first-party application and every embedded service. Start by disabling unused sensitive capabilities, then add narrow allowlists for required flows. Use exact serialized origins with the correct scheme and avoid broad delegation. Test top-level and embedded behavior in supported browsers, including permission prompts, denial paths, and cross-origin frames. Review console messages for blocked features. Keep the policy synchronized with iframe markup and third-party integration changes. This header complements CSP sandboxing and source controls but serves a different purpose: controlling browser features rather than network resource locations.
