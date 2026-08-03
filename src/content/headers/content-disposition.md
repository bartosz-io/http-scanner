---
headerName: content-disposition
description: Content-Disposition suggests inline display or download handling and can provide filename metadata for saving a response representation.
applicability: response
syntax: "Content-Disposition: inline | attachment[; filename=<value>][; filename*=<encoded-value>]"
examples:
  - "Content-Disposition: attachment; filename=\"report.pdf\""
  - "Content-Disposition: inline"
useCases:
  - Prompt download of a generated file with a safe user-facing filename.
  - Indicate that a supported representation can be displayed inline by the user agent.
commonMistakes:
  - Inserting an unsanitized user-supplied filename containing path, control, or quoting characters.
  - Assuming attachment prevents active content from ever being interpreted by a browser or downstream tool.
securityConsiderations: Filenames are untrusted presentation metadata; recipients must avoid path traversal, extension confusion, overwrites, and execution based solely on the suggested name.
relatedHeaders:
  - content-type
  - x-content-type-options
  - content-location
references:
  - label: RFC 6266 Content-Disposition
    url: https://www.rfc-editor.org/rfc/rfc6266
  - label: MDN Content-Disposition
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition
---
## Meaning and behavior

Content-Disposition supplies handling advice for a response representation. `inline` indicates ordinary display where the media type and user agent support it. `attachment` indicates that the user agent should present a save interaction rather than normal inline rendering. The optional `filename` parameter suggests a name, while `filename*` supports an encoded international value defined by the relevant specifications. These are suggestions; user agents can adjust names and handling for safety or platform rules.

The field does not define the media type. Content-Type still describes the bytes, and nosniff can prevent certain unsafe reinterpretation. Nor does `attachment` make hostile HTML, SVG, archives, or office documents safe after download. Filenames can contain misleading extensions, Unicode confusables, reserved names, or attempted path syntax, so recipients must treat them as untrusted metadata.

## Implementation notes

Generate a conservative ASCII fallback filename and a standards-compliant `filename*` when international text is required. Remove control characters, separators, path components, and ambiguous trailing characters. Select an extension consistent with the actual media type, but do not rely on extension for validation. Quote parameters correctly and prevent response splitting. Test major browsers with spaces, Unicode, long names, duplicates, and absent parameters. For user uploads, scan and isolate content according to risk, serve accurate Content-Type, and consider a separate download origin. Verify both inline and attachment flows after CDN transformations.
