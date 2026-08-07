# Content-Type and Set-Cookie SEO Design

## Goal

Improve the two existing indexed HTTP header reference pages with search-intent coverage and clearer internal conversion paths, without changing their URLs or introducing new page types.

## Scope

- Expand `content-type.md` around media types, `text/html`, charset, MIME sniffing, `X-Content-Type-Options`, and practical response examples.
- Expand `set-cookie.md` around `Secure`, `HttpOnly`, `SameSite`, `Max-Age`, `Expires`, `__Host-`, CORS credentials, and safe session-cookie handling.
- Keep frontmatter schema, slugs, references, and existing component architecture unchanged.
- Add source-level contract assertions for the SEO topics that must remain present.

## Success criteria

- Both guides remain valid under the existing content contract.
- Each guide contains at least the intended query/topic vocabulary in meaningful prose, not keyword-only text.
- Each guide preserves actionable implementation and security guidance.
- `npm test`, `npm run lint`, and `npm run build` pass.

## Non-goals

- No URL migration, schema markup, new checker, or analytics changes.
- No optimization for irrelevant queries found in GSC.
