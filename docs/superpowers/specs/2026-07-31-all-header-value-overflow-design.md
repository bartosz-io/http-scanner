# All-header value overflow fix

## Problem

An HTTP response header can contain a long value with no safe wrap point, such
as an encoded `Report-To` URL. In the all-headers report, that value contributes
its min-content width to the card and can make the report wider than its page
container. The value wrapper already requests horizontal overflow, but its
ancestors do not allow it to shrink below the value's min-content width.

## Design

Keep the existing card and value presentation. Constrain the all-header card,
its content area, and the value wrapper to the available report width by using
`min-width: 0` and `max-width: 100%` utilities at the relevant containment
boundaries. Keep horizontal overflow on the value wrapper so an unbroken token
scrolls inside that wrapper instead of expanding the page.

Do not use `break-all`: arbitrary wrapping makes URLs, cookies, and encoded
values harder to inspect and differs from the established security-report
interaction.

## Scope

Only `AllHeaderCard` changes. Header formatting, filtering, persistence, API
responses, and the security-analysis view remain unchanged.

## Verification

- Add a regression test that renders an all-header card and verifies the
  containment and horizontal-overflow contract.
- Run the targeted test first and confirm it fails before implementation.
- Run the complete test suite, lint, and production build.
- Verify in a browser that a long unbroken `Report-To` value does not increase
  the document width and that its value area can scroll horizontally.
