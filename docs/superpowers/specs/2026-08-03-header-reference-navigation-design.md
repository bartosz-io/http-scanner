# Header Reference Navigation Design

**Date:** 2026-08-03

## Goal

Make the HTTP Header Reference a first-class product area by linking to its index directly from the shared primary navigation. This should improve discovery for users and strengthen the internal-link path from every page to the `/headers/` cluster.

## Navigation

The primary navigation will contain four destinations:

1. `Security Scanner` → `/`
2. `HTTP Headers` → `/http-headers-checker/`
3. `Header Reference` → `/headers/`
4. `Reports` → `/reports`

The logo remains a link to the homepage. Although the first link and logo share a destination, the explicit `Security Scanner` label explains the homepage's function and avoids the vague `Home` label.

## Responsive behavior

Desktop navigation uses the full labels above. At narrow viewport widths, labels become `Security`, `Headers`, and `Reference`. `Reports` is hidden at the smallest breakpoint and remains available in the site footer, preventing the primary product links from overflowing the header.

No dropdown or mobile menu is introduced. The navigation remains server-rendered, keyboard-accessible, and usable without JavaScript.

## Analytics and SEO

The reference link points directly to `/headers/`; no intermediate route or client-side navigation is used. Existing analytics conventions may be applied to the new link, but the navigation must remain functional if analytics fails.

## Verification

- Update the shared navigation contract test to require the `/headers/` link and its label.
- Verify the existing narrow-viewport navigation contract still passes.
- Run the targeted navigation/SEO tests, lint, and production build.
- Manually inspect the header at a narrow mobile viewport and at desktop width to confirm there is no horizontal overflow.

