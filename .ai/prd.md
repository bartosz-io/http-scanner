# Product Requirements Document (PRD) – HTTPScanner.com (MVP)

## 1. Product Overview
HTTPScanner.com is a “scan‑and‑share” web application that automatically analyzes public websites for the presence and quality of security headers, following the OWASP Secure Headers Project recommendations. Each scan produces a detailed report (HTML/JSON) containing:
* an aggregate score from 0 to 100 calculated from weighted rules,
* a list of detected and missing headers,
* identification of headers that leak infrastructure details (leaking headers),
* short explanations with links to Dev‑Academy educational materials,
* a unique hash‑based URL that can be publicly shared,
* an automatically generated share graphic (PNG 1200 × 630) branded “Web Security Dev Academy”.

The application consists of two main components:  
1. A front‑end hosted on Netlify (static SPA with serverless routes),  
2. A scanning engine running as a Cloudflare Worker (server side, HTTP/1.1, IPv4) that completes a scan in ≤ 15 s (max 3 retries × 15 s, stops on first success).

## 2. User Problem
Web developers at all experience levels:
* do not know which security headers are essential,
* do not know how to correctly implement policies such as CSP and HSTS,
* lack an easy way to measure and compare security posture,
* are unaware that headers like *Server* or *X‑Powered‑By* leak sensitive information.

HTTPScanner.com enables them, in under a minute, to:
* assess their header configuration,
* receive clear remediation guidance,
* showcase their score, motivating further learning.

## 3. Functional Requirements
| ID | Requirement |
|----|-------------|
| FR‑01 | The user can enter a public URL to be scanned. |
| FR‑02 | The scanner performs a HEAD request (fallback to GET) with 301/302 follow‑redirect and analyzes only the final response. |
| FR‑03 | The system calculates a 0–100 score based on positive/negative weights from `weights.json`, normalised to the range. |
| FR‑04 | Each header in `headers‑leak.json` subtracts 1 point and appears in the “Fingerprinting headers to remove” section. |
| FR‑05 | The report (HTML + equivalent JSON) is stored in the database with hash‑ID and a 32‑char hexadecimal deleteToken. |
| FR‑06 | The report’s hash URL is public; the front‑end generates share graphics with score and branding, and adds OpenGraph/Twitter meta. |
| FR‑07 | Rate limit: 1 scan per domain (sub‑domains counted separately) per hour; 5 DELETE requests per IP/hour – enforced in Cloudflare WAF. |
| FR‑08 | `POST /api/report/delete` deletes a report given a valid `hash` and `deleteToken`, returning 204 No Content. |
| FR‑09 | The front‑end shows a Delete/Cancel modal and handles success/error via a unified toast message. |
| FR‑10 | The admin dashboard (basic‑auth) shows: scans per day, median time‑to‑scan, number and success rate of DELETE, timeout errors. |
| FR‑11 | The application sets its own CSP (`default‑src 'self'`), Referrer‑Policy (`same‑origin`), a restrictive Permissions‑Policy, and HSTS. |
| FR‑12 | CI/CD in GitHub Actions: lint → unit tests → Playwright e2e → deploy preview → production deploy. |
| FR‑13 | The user can share the report on social media via “Share on LinkedIn/Twitter” button. |
| FR‑14 | The `.well‑known/httpscanner-ignore` endpoint (200 OK) lets a site owner opt out of automatic scans. |

## 4. Product Boundaries
* No user accounts, registration, or authentication except basic‑auth for the admin dashboard.  
* No report export (PDF/HTML) and no public API in the MVP.  
* CSP details are not evaluated (only presence).  
* IPv4 and HTTP/1.1 only; no HTTP/2 or QUIC support.  
* No report versioning; re‑scan available after 1 h.  
* Mobile app out of scope; front‑end is responsive.  
* Storage of share graphics and DB backup beyond 60 days is TBD.  
* Mixed‑content in Dev‑Academy articles is not handled – links open in a new browser tab.

## 5. User Stories
| ID | Title | Description | Acceptance Criteria |
|----|-------|-------------|---------------------|
| US‑001 | Site scan | As a developer, I want to enter a URL to check my security headers. | a) After entering a valid URL and clicking “Scan”, I receive results in ≤ 15 s. b) The report shows detected/missing headers, numeric score, and an educational section. |
| US‑002 | Rate limiting notice | As a developer, I want to know if a domain was recently scanned to avoid abuse. | a) If I scan the same domain within 1 h, the app displays a limit message and skips the scan. |
| US‑003 | Redirect handling | As a developer, I want the scanner to follow redirects so I get the final URL’s result. | a) Report shows only headers from the final response. b) Scoring uses those headers only. |
| US‑004 | Leaking headers information | As a developer, I want to know which headers leak data so I can remove them. | a) Report lists “leaking headers” with a removal recommendation. b) Each lowers the score by 1 point. |
| US‑005 | Share score | As a developer, I want to share my score on LinkedIn to show my security focus. | a) Clicking “Share on LinkedIn” opens a share window with correct title, description, and PNG 1200 × 630. |
| US‑006 | Delete report | As a developer, I want to delete a report generated by mistake. | a) I click “Delete”, enter deleteToken, receive “Report deleted” toast. b) Re‑opening the hash URL returns 404. |
| US‑007 | Invalid token feedback | As a developer, I want feedback on an invalid token to try again. | a) Invalid token shows “Invalid token” modal message. b) DELETE does not remove the report. |
| US‑008 | Scan timeout notice | As a developer, I want a message when a scan fails due to timeout. | a) After 3 attempts without response, the report status is “Scan timeout” without reducing the score. |
| US‑009 | Admin monitoring | As an admin, I want to view scan statistics to measure system usage. | a) After basic‑auth login, I see a dashboard with scans/day, median scan time, DELETE count. |
| US‑010 | Server opt‑out | As a site owner, I want to block the scanner from my domain. | a) If `.well‑known/httpscanner-ignore` returns 200, any scan attempt ends with “Scan disabled by site owner”. |
| US‑011 | Service’s own headers | As a user, I want to be sure HTTPScanner.com itself uses recommended headers. | a) Dev‑tools inspection shows CSP, Referrer‑Policy, Permissions‑Policy, and HSTS as specified. |
| US‑012 | E2E testing | As a QA engineer, I want automated tests of critical paths to ensure release stability. | a) GitHub Actions Playwright tests pass for: scan success, timeout, invalid hash, delete success. |

## 6. Success Metrics
| Metric | MVP Target | Measurement Tool |
|--------|-----------|------------------|
| Unique reports per day | ≥ 10 | Admin dashboard |
| Average scan time | ≤ 15 s | Scanner logs / dashboard |
| Successful DELETE rate | ≥ 95 % | DELETE logs vs invalid tokens |
| Share‑link traffic share | to be determined (level X) | UTM + analytics |
| Timeout errors per day | ≤ 5 % of scans | Admin dashboard |
| Service availability | ≥ 99.5 % monthly | Uptimerobot / Cloudflare |