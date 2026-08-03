---
headerName: x-generator
description: X-Generator is non-standard metadata used by some content systems to identify the software or build tool that produced a response.
applicability: response
syntax: "X-Generator: <implementation-defined product>"
examples:
  - "X-Generator: Drupal 11"
useCases:
  - Detect default CMS disclosure that has no production requirement.
  - Diagnose which publishing pipeline generated content in a controlled staging environment.
commonMistakes:
  - Assuming removal makes a recognizable CMS installation anonymous or secure.
  - Stripping the response field while meta generator tags and public assets disclose the same product.
securityConsiderations: Removing product and version hints can reduce passive enumeration, but current extensions, core patches, and hardened administration are far more important.
relatedHeaders:
  - server
  - x-powered-by
  - x-aspnet-version
references:
  - label: Drupal security documentation
    url: https://www.drupal.org/security
  - label: RFC 9110 field extensibility
    url: https://www.rfc-editor.org/rfc/rfc9110#name-field-extensibility
---
## Meaning and behavior

X-Generator is a non-standard field that can name a content management system, static publisher, or other tool involved in producing a response. Values and insertion rules are implementation-specific. `Drupal 11`, for example, communicates a product family, but the field is not a signed software bill of materials and may be changed by modules, deployment configuration, or intermediaries. Some products expose similar information in HTML meta elements rather than, or in addition to, a response header.

The value can contribute to automated technology fingerprinting. Attackers can often infer the same platform from paths, markup, scripts, cookies, and behavior, so removing X-Generator is a small reduction in unnecessary disclosure rather than a security boundary. A false or generic value can also mislead operators without materially deterring targeted analysis.

## Implementation notes

Use the CMS or publisher's supported configuration or extension point to suppress the field when it serves no user-facing purpose. Search generated HTML for generator metadata and review public asset version parameters as part of the same disclosure inventory. Test cached pages, feeds, API responses, errors, previews, and administrative routes because each can use a different rendering path. Maintain internal deployment records that identify exact core and extension versions. Apply security updates promptly, minimize installed extensions, protect administrative interfaces, and avoid relying on banner removal as evidence that the platform is safe.
