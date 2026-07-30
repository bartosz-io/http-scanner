# Homepage Security Headers SEO Design

**Date:** 2026-07-30
**Status:** Approved
**Scope:** Homepage SEO only

## Context

The homepage already provides a working HTTP security header scanner, but its
server-rendered copy is short and does not fully answer the search intent behind
queries such as `security headers checker`, `check security headers`, and
`security header scanner`.

The latest Google Search Console export shows an early opportunity:

- 120 impressions and 0 clicks across the security-header query cluster;
- `header scanner`: 21 impressions, average position 9.67;
- `security headers scanner`: 19 impressions, average position 26;
- `security header scanner`: 17 impressions, average position 24.53;
- `scan headers`: 12 impressions, average position 8.58;
- `http header scanner`: 10 impressions, average position 8.9.

DataForSEO US search-volume data supports the same intent:

- `security headers checker`: 320 searches/month, keyword difficulty 26;
- `check security headers`: 320 searches/month, keyword difficulty 21;
- `security headers scanner`: 70 searches/month, keyword difficulty 19;
- `security headers test`: 50 searches/month, keyword difficulty 29.

The scanner is narrower than a full website vulnerability scanner. The homepage
must describe that boundary accurately rather than target broader queries with a
misleading product promise.

## Goals

1. Make the homepage the canonical landing page for security-header checking
   intent.
2. Explain what the scanner checks, how it works, how to interpret the report,
   and what it does not cover.
3. Preserve immediate access to the scanner above the fold.
4. Render the new content as static Astro HTML so it is available without
   client-side JavaScript.
5. Establish a measurable baseline for evaluating the SEO change.

## Non-goals

- Adding a WebSecurity Academy CTA.
- Adding a security-review or consulting CTA.
- Changing the scanner flow, report logic, scoring, or API behavior.
- Repositioning the product as a full website vulnerability scanner or
  penetration test.
- Creating separate SEO landing pages.
- Adding FAQ structured data.

## Selected Approach

Use an intent-complete homepage rather than a metadata-only change or a
long-form pillar guide.

The metadata-only option would leave the visible page too thin to answer the
query comprehensively. A long-form guide would weaken the tool-first experience
and compete with future educational pages. The selected approach keeps the
scanner first and adds concise, useful content below it.

The page should contain approximately 900–1,200 words if that range can be
reached without repetition or filler. Completeness and accuracy take priority
over a fixed word count.

## Keyword Strategy

### Primary query

- `security headers checker`

### Supporting queries

- `check security headers`
- `security header scanner`
- `security headers scan`
- `security headers test`
- `HTTP security headers`
- `website security headers`

The primary query should appear once in the title and once in the H1. Supporting
phrases should occur only where they fit naturally. The page must not use lists
of keyword variants as prose or repeat exact phrases mechanically.

### Explicitly excluded target

- `website security scanner`

That query implies vulnerability discovery beyond HTTP response-header
analysis. It should not be a homepage target unless the product's capabilities
expand.

## Metadata and Hero

### Title

> Security Headers Checker — Free HTTP Security Scan

### Meta description

> Check your website’s HTTP security headers for missing or weak CSP, HSTS,
> X-Frame-Options, Permissions-Policy and more. Get a free, actionable report.

### H1

> Free Security Headers Checker

### Hero copy

> Check the HTTP security headers of any public website. Find missing
> protections, risky configuration and information leaks, then get practical
> remediation guidance — no account required.

The existing scanner form remains directly beneath the hero copy. There is no
additional marketing or sales CTA.

## Page Structure and Copy

### 1. Hero and scanner

Use the approved metadata and hero copy above. Preserve the current scanner
island and its placement above the fold.

### 2. What does the security headers checker do?

> HTTP security headers tell browsers how to handle your website and which
> potentially dangerous behaviors to restrict. A missing or weak header can
> leave users more exposed to attacks such as clickjacking, content injection
> or insecure transport.
>
> The scanner requests the public URL you provide, reads its HTTP response
> headers and evaluates the detected security controls. The resulting report
> highlights missing protections, risky values and information that may
> unnecessarily reveal details about the server.

This section establishes the scope before listing individual headers.

### 3. Which security headers are checked?

Introduction:

> The scan covers the following HTTP security headers. Some are recommended
> broadly, while others only apply to particular applications or response
> types.

Display the supported headers in four groups:

#### HTTPS and transport security

> Strict-Transport-Security helps browsers use encrypted HTTPS connections
> instead of falling back to insecure HTTP.

- `Strict-Transport-Security`

#### Content and browser protections

> These headers restrict which resources can run, how the page may be embedded,
> what browser features it can use, and how referrer information is shared.

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

#### Cross-origin isolation

> Cross-origin policies control how the document interacts with resources and
> browsing contexts served by other origins.

- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Embedder-Policy`
- `Cross-Origin-Resource-Policy`
- `Origin-Agent-Cluster`

#### Site data and legacy browser controls

> These situational headers can clear local browser data or restrict behavior
> retained for compatibility with older clients and plugins.

- `Clear-Site-Data`
- `X-Permitted-Cross-Domain-Policies`
- `X-DNS-Prefetch-Control`

The list must stay synchronized with the security parsers registered in
`worker/impl/parsers/security/index.ts`. Do not claim that every header is
required on every response.

### 4. How to check your website’s security headers

Present the process as three steps:

1. **Enter a public website URL**

   > Provide the HTTPS or HTTP address you want to inspect.

2. **Run the security headers scan**

   > The scanner retrieves the response and analyzes the supported headers and
   > their values.

3. **Review the actionable report**

   > See which protections passed, which require attention and how the
   > configuration can be improved.

### 5. How to interpret the scan results

> The report separates correctly detected protections from headers that are
> missing, weak or require review. It may also identify response headers that
> reveal unnecessary information about the server or application.
>
> A strong result means that the analyzed response has a solid browser-facing
> security configuration. It does not prove that the website is free from
> vulnerabilities. Security headers are one layer of defence and must be
> combined with secure application code, access control, dependency management
> and regular security testing.

### 6. What this security header scanner does not test

> This is a focused HTTP security header scanner, not a complete website
> vulnerability scanner or penetration test. It does not authenticate to your
> application, crawl every route, test business logic, exploit vulnerabilities
> or inspect server-side source code.
>
> Results apply to the public response returned for the scanned URL. Other
> pages, APIs and authenticated areas may return different headers and should be
> tested separately.

### 7. Security headers FAQ

Render the FAQ as visible semantic HTML without `FAQPage` structured data.

#### What are HTTP security headers?

> HTTP security headers are response headers that instruct a browser to enforce
> protections such as HTTPS, content restrictions, framing controls and
> cross-origin isolation.

#### How can I check my website’s security headers?

> Enter a public URL into the scanner. It retrieves the HTTP response,
> identifies supported security headers and evaluates the values it receives.

#### Which security headers should a website have?

> The appropriate configuration depends on the application, but commonly
> relevant headers include Content-Security-Policy, Strict-Transport-Security,
> X-Content-Type-Options, Referrer-Policy and Permissions-Policy.

#### Does a high security headers score mean my website is secure?

> No. It indicates that the analyzed response has stronger browser-facing
> controls. It does not test application logic, authentication, dependencies or
> server-side vulnerabilities.

#### Can security headers prevent every web attack?

> No. They can reduce the likelihood or impact of several browser-based attacks,
> but they are a defence-in-depth measure rather than a replacement for secure
> development and security testing.

### 8. Recent scans

Move the existing recent-scans component below the educational content. It
remains useful product content but should not interrupt the explanation of the
scanner's purpose and limitations.

## Rendering and Architecture

- Place the new visible content in the Astro homepage or small static Astro
  presentation components.
- Do not move SEO copy into a React island.
- Preserve the current scanner island and recent-scans island hydration
  behavior.
- Preserve the homepage canonical URL, sitemap membership, and analytics.
- Use semantic heading order: one H1 followed by descriptive H2 and H3
  headings.
- Do not add hidden keyword text or structured data that is not supported by
  visible page content.

## Verification

Implementation verification must include:

1. A targeted automated test or build-time assertion covering the expected
   title, meta description, H1, and key section headings.
2. Inspection of the generated homepage HTML to confirm the content is present
   before JavaScript executes.
3. Existing automated tests.
4. `npm run lint`.
5. The production build.
6. A local browser check at desktop and mobile widths, including:
   - scanner remains above the fold and usable;
   - heading hierarchy is visually clear;
   - long header names wrap without overflow;
   - the recent-scans component still loads;
   - no hydration or console errors are introduced.

## Measurement Plan

Use the existing GSC export as the pre-change baseline:

- security-header query cluster: 120 impressions, 0 clicks;
- measurement page: homepage;
- measurement dimensions: clicks, impressions, CTR, and average position.

Review:

1. An early directional comparison after 28 days.
2. A primary evaluation after 6–8 weeks.

Compare equivalent date windows and evaluate the whole query cluster rather
than treating movement for one exact keyword as the outcome. Also compare
homepage organic entrances with scanner-start events in the existing analytics
to determine whether additional traffic uses the product.

Avoid changing the homepage title or primary copy during the measurement window
unless a factual or technical defect requires correction.

## Risks and Mitigations

### The page becomes too long for tool users

Keep the scanner above the fold, use short sections and grouped header lists,
and move deeper educational material to future dedicated pages.

### The copy overstates product coverage

List only parsers registered by the Worker, describe situational headers
carefully, and retain the explicit limitations section.

### Keyword repetition weakens readability

Use one primary phrase and semantic variants only where they describe the
content naturally. Prioritize clarity over density.

### Future scanner changes make the header list stale

Protect the important page contract with a targeted test and treat the Worker
parser registry as the source of truth during reviews.
