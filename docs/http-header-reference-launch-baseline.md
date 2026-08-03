# HTTP Header Reference launch baseline

## Release status and evaluation window

- Baseline recorded: 2026-08-03.
- Deployment status: not deployed by this task. Record the actual production deployment and indexing date after release.
- Baseline window: 2026-06-18 00:00 through 2026-07-15 23:59 (28 complete days).
- First evaluation: 28 days after Google indexes the reference index and guide URLs. If indexing begins on 2026-08-03, evaluate on 2026-08-31.
- Primary outcome: organic sessions landing in the new header-reference cluster and the percentage of those sessions that submit at least one scan.

## Google Search Console baseline

The source is the Search Console export at `outputs/httpscanner.com-Performance-on-Search-2026-07-17/Wykres.csv`. Its latest available date is 2026-07-15, so the final 28 complete rows define the baseline window.

| Metric | Baseline |
|---|---:|
| Clicks | 61 |
| Impressions | 1,089 |
| CTR | 5.60% |
| Average position | 11.48 |

CTR is clicks divided by impressions. Average position is reconstructed as the impression-weighted mean of the daily position values in the export; use Search Console's native period total at the first evaluation when available.

## PostHog baseline

The source is the `Http Scanner` PostHog project. Test accounts are excluded. Organic traffic is defined by PostHog session channel `$channel_type = 'Organic Search'` for the same UTC window.

| Metric | Baseline |
|---|---:|
| Organic landing sessions | 68 |
| All `scan submitted` events | 55 |
| Organic sessions with at least one `scan submitted` event | 31 |
| `scan submitted` events in organic sessions | 45 |
| Organic session-to-scan rate | 45.59% |

The session-to-scan rate is 31 converted organic sessions divided by 68 organic landing sessions. Event totals are recorded separately because one session can submit more than one scan.

## URL groups

- Existing checker: `https://httpscanner.com/http-headers-checker/`
- Reference index: `https://httpscanner.com/headers/`
- Reference guides: the 45 catalog-backed URLs matching `https://httpscanner.com/headers/<header-slug>/`
- Existing security checker: `https://httpscanner.com/`

At evaluation time, report the new cluster separately from the existing checker and homepage. Compare organic landing sessions, converted sessions, scan events, GSC clicks and impressions for each group. Do not include `/report`, `/reports`, or `/share` URLs.

## Verification evidence before release

- Generated inventory: 45 guide documents, 45 guide HTML files and 47 sitemap URLs for the checker, index and guides.
- Local HTTP: representative guides returned 200; an unknown guide returned the static 404; a valid report shell returned 200 with `noindex,nofollow`.
- Browser QA: index, guide and report layouts had no document-level horizontal overflow at 375 px or 1440 px; the report opened in All response headers mode, filters worked, known fields linked to guides, unknown fields remained text, and view switching retained one report fetch.
- Analytics: static discovery links expose only the two bounded event names; report guide clicks contain only the catalog header name and fixed report view.
