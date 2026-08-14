# Server-Timing metric list design

## Problem

The current Server-Timing figure separates the request path from the timing section, but the lower section still behaves visually like a timeline. Its proportional columns, left-to-right metric placement, `128 ms` total, and derived `33 ms` remainder imply chronology and additivity that the response field does not provide.

`Server-Timing` publishes named metrics and optional durations. It does not give each metric a start position or map metric order to the request path. Reordering the cards would therefore replace one false chronology with another.

## Chosen design

Keep `Request path` as the figure's only directional visualization. Replace the complete `Illustrative timing breakdown` with a documentation-style section named `What Server-Timing publishes`.

The section will show, in this order:

1. The actual response field: `Server-Timing: db;dur=53.2, app;dur=41.8`.
2. A short explanation that the field contains named metrics, not request-path steps, and that field order does not represent execution order.
3. A semantic definition list that explains the two published metrics:
   - `db` — duration: `53.2 ms`
   - `app` — duration: `41.8 ms`

The definition list is explanatory content, not a visualization. It must not use cards, bars, proportional widths, arrows, segment styling, or alignment that suggests a relationship to Browser, CDN, Application, or Database.

## Removed concepts

- `Browser-observed response wait: 128 ms`
- `Other response time: 33 ms`
- `Not sent in Server-Timing`
- the proportional three-column timing grid
- the `Illustrative timing breakdown` label
- any suggestion that the displayed durations partition TTFB or form a timeline

## Structure and styling

- Preserve the current static request-path markup and desktop/mobile arrows.
- Rename the lower semantic region without adding client-side JavaScript or hydration.
- Render the response field before the definition list.
- Style the definition list as ordinary guide documentation with simple rows and typography, not as boxed timing phases.
- Keep all new CSS scoped below `[data-server-timing-timeline]` and reuse existing design tokens.
- On mobile, allow the term and duration to stack naturally without horizontal overflow.

## Content consistency

Update the paragraphs immediately below the figure so they no longer refer to `db` and `app` spans "above" or to deliberately non-overlapping illustrated spans. Retain the technically important explanation that real metrics may overlap, nest, omit work, and lack a standard per-metric `startTime`.

## Verification

- Add a structural DOM regression test before changing production content.
- Require one labelled publishing region with one semantic definition list containing exactly two metric definitions.
- Require the response field to remain inside the publishing region.
- Require the removed total, timing phases, and unreported marker to be absent.
- Do not assert explanatory sentence occurrences.
- Run focused content/style contracts, the full test suite, lint, and build.
- Inspect the rendered guide at desktop and mobile widths and confirm that only the request path reads as a directional diagram.

## Out of scope

- Changing the request-path nodes or direction.
- Adding real tracing data, metric start times, or scanner-report behavior.
- Changing the Server-Timing syntax examples elsewhere in the guide.
