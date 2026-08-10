# Content-Type and Set-Cookie SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing Content-Type and Set-Cookie reference pages for their newly emerging GSC queries while preserving the current URL and content architecture.

**Architecture:** Keep both guides as Astro content-collection Markdown consumed by the existing dynamic `[slug].astro` route. Extend their frontmatter descriptions only where needed and add high-quality sections to the Markdown bodies. Protect the intended topic coverage with source-level Vitest assertions.

**Tech Stack:** Astro content collections, Markdown, TypeScript, Vitest, ESLint.

## Global Constraints

- Preserve `/headers/content-type/` and `/headers/set-cookie/`.
- Use existing frontmatter fields and Markdown headings.
- Keep the copy technically accurate and implementation-oriented.
- Do not add structured data or client-side code in guide sources.

### Task 1: Add failing SEO content contracts

**Files:**
- Modify: `src/lib/headerContentContract.test.ts`

- [x] **Step 1: Write assertions for required Content-Type topics**

Assert the source contains `text/html`, `charset=utf-8`, `MIME type`, `nosniff`, and a concrete response example.

- [x] **Step 2: Write assertions for required Set-Cookie topics**

Assert the source contains `Secure`, `HttpOnly`, `SameSite`, `Max-Age`, `Expires`, `__Host-`, and CORS credentials guidance.

- [x] **Step 3: Run the focused test and verify RED**

Run `npm test -- src/lib/headerContentContract.test.ts`.
Expected: failure because the current guide sources do not contain all required topic phrases.

### Task 2: Expand Content-Type guide

**Files:**
- Modify: `src/content/headers/content-type.md`

- [x] **Step 1: Add practical query-aligned explanations**

Cover media type vs charset, common HTML/JSON responses, MIME sniffing, `X-Content-Type-Options: nosniff`, upload/download behavior, and debugging through the HTTP Headers Checker.

- [x] **Step 2: Preserve security boundaries**

Explain that changing Content-Type does not sanitize untrusted bytes and that final headers must be checked after CDN/proxy transformations.

### Task 3: Expand Set-Cookie guide

**Files:**
- Modify: `src/content/headers/set-cookie.md`

- [x] **Step 1: Add practical cookie-attribute explanations**

Cover `Secure`, `HttpOnly`, `SameSite`, `Max-Age`, `Expires`, host-only scope, `__Host-`, and deletion with matching scope.

- [x] **Step 2: Add cross-origin and session guidance**

Explain CORS credential interactions, session rotation/fixation, and why cookie attributes do not replace server-side authorization.

### Task 4: Verify and review

**Files:**
- No additional files.

- [x] **Step 1: Run focused tests and then the full test suite**

Run `npm test -- src/lib/headerContentContract.test.ts`, then `npm test`.

- [x] **Step 2: Run lint and production build**

Run `npm run lint` and `npm run build`.

- [x] **Step 3: Inspect the diff**

Confirm only the two guides, their source contract test, and the design/plan documents changed; verify no URL or frontmatter contract was unintentionally altered.
