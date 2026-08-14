# Server-Timing diagram clarity design

## Problem

The diagram stacks a four-column request path above a three-column timing breakdown. Although the grids represent different concepts, their vertical alignment makes `db` appear to belong to `Browser`. The path also has no visible direction, and `unreported` can be mistaken for a metric present in the displayed `Server-Timing` field.

## Chosen design

Keep both educational ideas, but present them as two visually independent, labelled regions:

1. **Request path** — `Browser → CDN → Application → Database`, with explicit horizontal arrows on larger screens and vertical arrows on narrow screens.
2. **Illustrative timing breakdown** — the browser-observed wait and its deliberately simplified `db`, `app`, and other-time segments.

The final segment will be named as other illustrative response time and explicitly marked as not sent in `Server-Timing`. The field example remains immediately below the breakdown so readers can compare reported segments with the actual response field.

## Structure and styling

- Add separate semantic wrappers and short labels for the request path and timing illustration.
- Keep the existing static HTML and scoped CSS; add no client-side JavaScript or hydration.
- Add spacing and a divider between the two regions so their columns cannot be read as a shared coordinate system.
- Render directional connectors with CSS and switch their direction at the existing mobile breakpoint.
- Preserve the current light card treatment and existing design tokens.

## Verification

- Add a DOM contract test proving that the request path and timing breakdown live in distinct labelled regions and that exactly one segment is marked as absent from the field.
- Keep the existing path-node, phase-count, caption, and no-script checks.
- Run the focused contract tests, lint, build, and visual checks at desktop and mobile widths.

## Out of scope

- Changing the metric values or the surrounding Server-Timing guide.
- Mapping every metric to a network hop; `Server-Timing` metric names do not inherently provide that relationship.
- Adding interaction, animation, or report-engine behavior.
