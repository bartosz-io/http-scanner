# Compact Lead Form Design

## Goal

Reduce the default height of the paid security help form so that, on desktop, it fits within the height of the adjacent security scoring card. Preserve the current submission, validation, privacy, and score-targeting behavior.

## Layout

- Render Name and Email in one two-column row on medium and larger screens.
- Stack Name and Email vertically on smaller screens.
- Keep the introductory copy short and retain the existing card heading.
- Keep the consent checkbox and submit button visible in the default compact state.
- Do not impose a fixed card height. The compact content should naturally fit the scoring card; validation errors and optional content may expand it.

## Optional Message

- Do not render the Message textarea initially.
- Render an unchecked checkbox labelled `Add custom message` in its place.
- When checked, show the existing optional Message textarea below the checkbox.
- When unchecked after entering text, hide the textarea and clear its value so hidden content cannot be submitted accidentally.
- Message remains optional in the shared submission contract and keeps the existing 2,000-character limit.

## Submission and State

- Name, Email, and contact consent remain required.
- With the custom-message checkbox off, submit an empty Message value through the existing API contract.
- Preserve duplicate-submission protection, success state, retry behavior, honeypot, PostHog privacy classes, and non-PII analytics.
- The custom-message UI state is local to the form and resets naturally when the form is replaced by the success state.

## Accessibility

- Both checkboxes have visible, associated labels.
- The Message textarea remains accessible by the label `Message` only while expanded.
- Keyboard and screen-reader users can reveal and hide the optional field through the native checkbox control.

## Verification

- Component tests cover the collapsed default state, expansion, clearing on collapse, field limits, and submitted payloads with and without a message.
- Existing validation, retry, privacy, analytics, and score-threshold tests continue to pass.
- Browser verification checks the desktop layout against a low-score production-style report and confirms the mobile fields stack without horizontal overflow.
