---
headerName: content-language
description: Content-Language identifies the natural language or languages intended for the representation's audience using standard language tags.
applicability: request-and-response
syntax: "Content-Language: <language-tag>[, <language-tag>...]"
examples:
  - "Content-Language: en-GB"
  - "Content-Language: pl"
useCases:
  - Label a localized document for indexing, accessibility, and downstream content selection.
  - Identify multiple intended audience languages when a representation is genuinely multilingual.
commonMistakes:
  - Listing every language quoted in a document instead of the language intended for its audience.
  - Inventing locale strings that are not valid BCP 47 language tags.
securityConsiderations: Language metadata is usually informational, but incorrect variant caching can disclose or serve user-specific locale content to the wrong audience.
relatedHeaders:
  - content-type
  - vary
  - content-location
references:
  - label: RFC 9110 Content-Language
    url: https://www.rfc-editor.org/rfc/rfc9110#name-content-language
  - label: BCP 47 language tags
    url: https://www.rfc-editor.org/info/bcp47
  - label: MDN Content-Language
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Language
---
## Meaning and behavior

Content-Language identifies the natural language or languages intended for the representation's audience. A value such as `en-GB` uses a BCP 47 language tag to express British English, while `pl` identifies Polish without a region. The field is not required to enumerate every language appearing in quotations, names, or examples. A language-learning page aimed at English speakers can contain extensive French text while still having English as its intended audience language.

The field can participate in content negotiation and caching, but it does not itself select a representation. A server might examine Accept-Language, choose localized content, return Content-Language, and include `Vary: Accept-Language`. HTML also has element-level language declarations, which serve document semantics and accessibility. HTTP metadata and markup should agree, but one does not automatically repair the other.

## Implementation notes

Use valid BCP 47 tags and derive them from the actual localized representation, not simply from a user profile setting. When negotiation changes content, configure the cache key deliberately and consider canonical URLs or Content-Location for language variants. Test default language, fallback behavior, unsupported preferences, crawlers, and shared caches. Avoid high-cardinality or unbounded variation that destroys cache efficiency. Verify HTML `lang` attributes and application copy separately. If a document targets multiple audiences, list only genuinely intended languages rather than every embedded fragment. Keep locale-specific private data protected with appropriate cache policy.
