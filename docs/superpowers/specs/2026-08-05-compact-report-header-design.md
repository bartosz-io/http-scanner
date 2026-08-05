# Compact Report Header Design

## Goal

Remove the unused desktop space above report results by combining report identity, metadata, and the report-view switch into one compact full-width header bar.

## Desktop Layout

- Place `Security Scan Report` on the left.
- Place the scanned URL and timestamp on one wrapping metadata line below the title.
- Place the existing `Security analysis` / `All response headers` switch on the right side of the same header bar.
- Reduce the vertical gap between the header bar and report content while retaining clear separation.
- Keep the existing report cards and their behavior unchanged.

## Responsive Layout

- Below the desktop breakpoint, stack the view switch below the title and metadata.
- Allow the URL to truncate visually instead of creating horizontal overflow.
- Make the switch use the available width on narrow mobile screens.
- Preserve full URL information in accessible text and do not change the underlying report data.

## Exceptional State

- When a delete token is present, keep its warning below the compact header as a separate full-width alert.
- Loading, error, report view selection, analytics, and report navigation behavior remain unchanged.

## Verification

- Component tests verify the compact header grouping and responsive class contract.
- Existing report-view contract tests remain green.
- Browser QA verifies reduced desktop height, mobile wrapping without horizontal overflow, and both report views.
