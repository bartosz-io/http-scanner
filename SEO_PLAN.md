# HTTP Scanner SEO Domination Plan

Last updated: 2026-08-10  
Program owner: HTTP Scanner  
Source of truth: this file

## 1. Objective

Build the strongest practical search destination for HTTP response headers by combining:

1. a free live HTTP security scanner;
2. a neutral HTTP headers checker;
3. technically accurate header reference pages;
4. implementation guides that turn findings into fixes.

The program prioritizes proven Google Search Console demand before expanding into strategically valuable clusters. We optimize one focused task at a time, measure the result, and allow new GSC evidence to change the queue.

## 2. Current baseline

The latest source is `outputs/httpscanner.com-Performance-on-Search-2026-08-07/`, covering 2026-05-24 through 2026-08-05.

| Metric | Baseline |
|---|---:|
| GSC clicks | 128 |
| GSC impressions | 2,790 |
| GSC CTR | 4.59% |
| Clicks in the latest 28 days | 45 |
| Impressions in the latest 28 days | 1,570 |
| Homepage clicks | 128 |
| Header guides with page-level impressions | 7 |
| Published header guides | 45 |

The homepage already ranks strongly for `http scanner`, `https scanner`, and `http scan`. The main growth constraint is non-brand traffic: reference pages are receiving impressions but have not yet produced clicks.

## 3. Operating model

Every execution cycle follows this sequence:

1. Select the highest-priority `NEXT` task from this plan.
2. Review its page-level and query-level GSC evidence.
3. Inspect the current SERP and authoritative technical sources.
4. Write a task-specific design spec in `docs/superpowers/specs/`.
5. Obtain approval for the spec.
6. Write the implementation plan in `docs/superpowers/plans/`.
7. Implement with tests, technical review, lint, and production build verification.
8. Deploy and request indexing in Google Search Console.
9. Observe the page for 14–21 days before judging the result.
10. Record the outcome and reprioritize this plan when evidence warrants it.

One task should normally cover one header. A task may cover two tightly coupled headers when they serve the same search intent and have separate acceptance criteria. The first CORS task uses this exception for `Access-Control-Allow-Origin` and `Access-Control-Max-Age`.

## 4. Status and priority definitions

| Status | Meaning |
|---|---|
| `DONE` | Optimization implemented, verified, and committed. |
| `NEXT` | Approved as the next task to specify and implement. |
| `QUEUED` | Included in an ordered future wave. |
| `OBSERVE` | Published but intentionally waiting for stronger demand or cluster support. |

| Priority | Meaning |
|---|---|
| `P0` | Existing GSC traction and a realistic path toward Top 10. |
| `P1` | Completes a high-value cluster or supports commercial search intent. |
| `P2` | Expands topical authority after the main clusters are established. |
| `P3` | Long-tail, legacy, or low-demand coverage. |

## 5. Active execution queue

| Order | Header | Status | Priority | GSC baseline | Why now | Spec |
|---:|---|---|---|---|---|---|
| 1 | Content-Type | `DONE` | P0 | 221 impressions, position 31.95 | Largest reference-page opportunity in the export. | [Design](docs/superpowers/specs/2026-08-07-content-type-set-cookie-seo-design.md) |
| 2 | Set-Cookie | `DONE` | P0 | 87 impressions, position 26.76 | Existing demand and security-focused implementation intent. | [Design](docs/superpowers/specs/2026-08-07-content-type-set-cookie-seo-design.md) |
| 3 | Access-Control-Allow-Origin | `DONE` | P0 | 58 impressions, position 30.71 | Third-largest guide opportunity and the entry point to the CORS cluster. | [Design](docs/superpowers/specs/2026-08-10-cors-origin-max-age-seo-design.md) |
| 4 | Access-Control-Max-Age | `DONE` | P0 | 33 impressions, position 25.33 | Best current average position among unoptimized guides and tightly coupled with CORS preflight intent. | [Design](docs/superpowers/specs/2026-08-10-cors-origin-max-age-seo-design.md) |

The next deliverable after approval of this document is the combined CORS design spec. It must define independent search intent, content requirements, internal links, tests, and acceptance criteria for both headers.

## 6. Header roadmap

The order within each wave is provisional. A new GSC export can promote a header when it crosses the opportunity thresholds in section 9.

### Wave 1 — CORS authority

Goal: own the browser CORS troubleshooting and implementation journey from origin permission through preflight caching.

| Order | Header | Status | Priority | Strategic role |
|---:|---|---|---|---|
| 5 | Access-Control-Allow-Credentials | `DONE` | P1 | Credentialed CORS, cookies, explicit origins, and common wildcard errors. |
| 6 | Access-Control-Allow-Methods | `DONE` | P1 | Preflight method authorization and OPTIONS troubleshooting. |
| 7 | Access-Control-Allow-Headers | `DONE` | P1 | Preflight request-header authorization and browser error resolution. |
| 8 | Access-Control-Expose-Headers | `QUEUED` | P1 | Browser access to non-safelisted response headers. |
| 9 | Vary | `QUEUED` | P1 | Correct cache separation for dynamic `Access-Control-Allow-Origin`. |

Exit criterion: all CORS guides link coherently to one another and to the HTTP Headers Checker, and at least two CORS URLs receive impressions in a rolling 28-day window.

### Wave 2 — security headers and commercial intent

Goal: connect high-value security searches to the scanner and future CSP/HSTS tooling.

| Order | Header | Status | Priority | Strategic role |
|---:|---|---|---|---|
| 10 | Content-Security-Policy | `QUEUED` | P1 | Highest-value security policy and future CSP checker/monitoring entry point. |
| 11 | Strict-Transport-Security | `QUEUED` | P1 | HSTS implementation, preload risk, and future HSTS checker. |
| 12 | X-Content-Type-Options | `QUEUED` | P1 | Extends the proven Content-Type cluster into browser security. |
| 13 | X-Frame-Options | `QUEUED` | P1 | Clickjacking protection and CSP `frame-ancestors` comparison. |
| 14 | Referrer-Policy | `QUEUED` | P1 | Privacy, analytics, and data-leak prevention intent. |
| 15 | Permissions-Policy | `QUEUED` | P1 | Modern browser capability restrictions and concrete implementation examples. |
| 16 | Cross-Origin-Opener-Policy | `OBSERVE` | P2 | Cross-origin isolation cluster. |
| 17 | Cross-Origin-Embedder-Policy | `OBSERVE` | P2 | Cross-origin isolation and resource loading requirements. |
| 18 | Cross-Origin-Resource-Policy | `OBSERVE` | P2 | Resource-level cross-origin restrictions. |
| 19 | Clear-Site-Data | `OBSERVE` | P2 | Logout, incident response, and browser storage cleanup. |
| 20 | Origin-Agent-Cluster | `OBSERVE` | P2 | Advanced browser isolation intent. |

Exit criterion: the security checker links to all primary security guides, and CSP/HSTS demand is strong enough to justify dedicated checker specs.

### Wave 3 — caching and content representation

Goal: broaden from security into everyday HTTP debugging while reinforcing Content-Type.

| Order | Header | Status | Priority | GSC signal or role |
|---:|---|---|---|---|
| 21 | Cache-Control | `QUEUED` | P1 | 15 impressions, position 48.27; large long-term search surface. |
| 22 | ETag | `QUEUED` | P2 | Validation and conditional request intent. |
| 23 | Last-Modified | `QUEUED` | P2 | Validation and cache freshness cluster. |
| 24 | Expires | `QUEUED` | P2 | Legacy freshness behavior and Cache-Control comparison. |
| 25 | Age | `OBSERVE` | P2 | CDN and shared-cache diagnostics. |
| 26 | Content-Encoding | `QUEUED` | P2 | Compression, `gzip`, `br`, and Content-Type relationship. |
| 27 | Content-Disposition | `QUEUED` | P2 | Downloads, inline rendering, filenames, and security. |
| 28 | Content-Length | `OBSERVE` | P2 | Message framing and debugging. |
| 29 | Content-Language | `OBSERVE` | P2 | Localization and content negotiation. |
| 30 | Content-Location | `OBSERVE` | P3 | Representation metadata and negotiation. |
| 31 | Accept-Ranges | `OBSERVE` | P2 | Partial downloads, media delivery, and byte ranges. |

Exit criterion: the HTTP Headers Checker has strong internal routes into caching and representation guides, with multiple URLs receiving non-brand impressions.

### Wave 4 — performance, authentication, and response control

Goal: capture developer troubleshooting searches adjacent to the core checker.

| Order | Header | Status | Priority | GSC signal or role |
|---:|---|---|---|---|
| 32 | Server-Timing | `QUEUED` | P1 | 15 impressions, position 28.53; current GSC opportunity. |
| 33 | Timing-Allow-Origin | `QUEUED` | P2 | Required companion for cross-origin Resource Timing. |
| 34 | Link | `QUEUED` | P2 | Preload, preconnect, canonical relationships, and performance. |
| 35 | WWW-Authenticate | `OBSERVE` | P2 | Authentication challenge and 401 troubleshooting. |
| 36 | Location | `QUEUED` | P2 | Redirect debugging and open-redirect security. |
| 37 | Retry-After | `OBSERVE` | P2 | Rate limiting, 429, and temporary unavailability. |

Exit criterion: performance and response-control guides produce measurable checker referrals or reach Top 20 for targeted queries.

### Wave 5 — infrastructure disclosure and legacy long tail

Goal: complete topical coverage without displacing stronger opportunities.

| Order | Header | Status | Priority | Strategic role |
|---:|---|---|---|---|
| 38 | Server | `QUEUED` | P2 | Information disclosure and server fingerprinting. |
| 39 | X-Powered-By | `QUEUED` | P2 | Framework disclosure and hardening. |
| 40 | Via | `OBSERVE` | P3 | Proxy and intermediary diagnostics. |
| 41 | X-AspNet-Version | `OBSERVE` | P3 | Framework-version disclosure. |
| 42 | X-Runtime | `OBSERVE` | P3 | Non-standard runtime timing metadata. |
| 43 | X-Generator | `OBSERVE` | P3 | Generator and CMS disclosure. |
| 44 | X-Permitted-Cross-Domain-Policies | `OBSERVE` | P3 | Legacy Adobe policy behavior. |
| 45 | X-DNS-Prefetch-Control | `OBSERVE` | P3 | Legacy/optional browser DNS behavior. |

Exit criterion: these pages are optimized only when GSC demand, scanner findings, or internal cluster requirements justify the work.

## 7. Definition of Done for a header task

A header optimization is complete only when:

- the task has an approved design spec and implementation plan;
- the page targets a distinct, documented search intent;
- title, description, H1, summary, syntax, examples, and body are mutually consistent;
- the body answers meaning, values, implementation, common errors, security boundaries, and debugging intent where applicable;
- examples are technically correct and do not encourage insecure copying;
- the page links to the HTTP Headers Checker and at least three relevant guides where the catalog permits it;
- relevant neighboring guides link back when that improves the user journey;
- tests protect critical topic coverage and technical distinctions;
- focused tests, the full test suite, lint, and production build are verified;
- technical review has no unresolved critical or important findings;
- the implementation plan checkboxes are marked complete;
- the URL is deployed, present in the sitemap, and submitted or inspected in GSC;
- the commit and observation start date are recorded in this plan.

## 8. Task-specific spec contract

Every header spec must include:

1. **Evidence:** GSC page/query data and current SERP pattern.
2. **Primary intent:** the single main problem the page solves.
3. **Secondary intents:** closely related questions that belong on the same URL.
4. **Technical boundaries:** statements that must remain accurate and unsafe simplifications to avoid.
5. **Content design:** required sections, examples, mistakes, and implementation guidance.
6. **Internal linking:** incoming and outgoing links with reasons.
7. **Metadata:** proposed title and description when changes are justified.
8. **Testing:** source-contract assertions and build-level expectations.
9. **Acceptance criteria:** independently verifiable completion conditions.
10. **Measurement:** GSC baseline, observation date, and success threshold.

## 9. Reprioritization rules

Run these rules after every comparable GSC export:

| Signal | Decision |
|---|---|
| At least 100 impressions and position 11–30 | Promote to `NEXT`; improve intent match, depth, and internal links. |
| At least 30 impressions and position 11–35 | Consider P0 when the page completes an active cluster. |
| Position 4–10 and CTR below 4% | Prioritize title and description testing instead of major content expansion. |
| Top 10 with no checker referrals | Review CTA placement and intent alignment. |
| No impressions after 21 days | Check indexing, canonical, sitemap, rendered HTML, and internal links before adding content. |
| Impressions grow for two exports | Preserve the URL and iterate; do not create a competing page. |
| Three weeks without cluster growth | Pause new guides and strengthen internal/external distribution. |
| New page exceeds the current `NEXT` opportunity | Reorder the queue and document the evidence here. |

## 10. Measurement cadence

For each completed task, record:

- deployment date;
- GSC inspection/submission date;
- baseline clicks, impressions, CTR, and position;
- values after 14 days;
- values after 21 days;
- checker referrals from that landing page;
- decision: `HOLD`, `ITERATE`, `PROMOTE CLUSTER`, or `DEPRIORITIZE`.

The primary program metrics are rolling 28-day non-brand clicks, the number of header URLs in Top 10 and Top 20, and organic landing-to-scan conversion. Homepage brand rankings are monitored but do not determine header priorities.

## 11. Completed task log

| Task | Status | Commit | Observation state |
|---|---|---|---|
| Content-Type and Set-Cookie SEO expansion | `DONE` | `3399646` | Awaiting post-deployment GSC comparison. |
| Access-Control-Allow-Origin and Access-Control-Max-Age SEO expansion | `DONE` | `9272e99`, `e9bbe6c` | Awaiting deployment and URL-filtered GSC baseline. |
| Access-Control-Allow-Credentials SEO expansion | `DONE` | `b9bd296` | Awaiting deployment and URL-filtered GSC baseline. |
| Access-Control-Allow-Methods SEO expansion | `DONE` | `73c7a6a` | Deployed 2026-08-12 (Cloudflare Version ID `6c9c938b-fce2-492b-99de-75c440599225`); production and Workers URLs return HTTP 200; awaiting URL-filtered GSC baseline. |
| Access-Control-Allow-Headers SEO expansion | `DONE` | `87a275f` | Awaiting deployment and URL-filtered GSC baseline. |

## 12. Next task

No newer GSC export is available after the 2026-08-07 baseline. Execute the next eligible roadmap task for:

- `Access-Control-Expose-Headers`.

The task should cover response-header readability, the CORS-safelisted response-header set, wildcard and credentials behavior, the `Set-Cookie` exclusion, and browser debugging.
