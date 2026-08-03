# Header analysis visual emphasis design

## Goal

Improve scanability in the HTTP Headers Analysis section by making each header name more prominent and showing the size of every top-level header category.

## Scope

- Render the Detected, Missing, and Leaking tabs with their current item counts.
- Always render the count, including zero, for example `Leaking (0)`.
- Increase header-name emphasis from semibold to bold and use the strongest existing slate text color.
- Keep the current header-name size, layout, icon, and card structure unchanged.

## Component changes

`HeadersSection` derives counts from `headers.detected`, `headers.missing`, and `headers.leaking`, then passes them to `HeaderTabs`. `HeaderTabs` remains responsible only for rendering and changing the selected tab.

`HeaderCard` changes the primary evaluated-card title styling to bold, high-contrast text. The separate `Not evaluated` card uses the same title emphasis so header names are consistent across card variants.

## Behavior and accessibility

Counts reflect the complete arrays behind each top-level tab and do not change when a secondary status filter is selected. The textual labels and visible numeric counts communicate the state without relying on color.

## Verification

- Add or update focused component tests for the three tab counts, including a zero Leaking count.
- Verify evaluated and not-evaluated header titles use the stronger title treatment.
- Run the relevant tests, lint, and production build.
