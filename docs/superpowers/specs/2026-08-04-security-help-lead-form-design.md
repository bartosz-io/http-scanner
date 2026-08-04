# Security Help Lead Form Design

## Goal

Replace the social-sharing card on low-scoring security reports with a focused lead form for paid help configuring HTTP security headers. Preserve the existing sharing experience for strong reports.

## Display Rules

- A report with `score < 80` shows the paid-help lead form in the right-hand card beside the score.
- A report with `score >= 80` shows the existing sharing card, including its generated image and LinkedIn/X actions.
- The boundary is exact: `79.99` shows the lead form and `80` shows sharing.
- Low-scoring reports do not expose a secondary sharing link inside or below the lead form.

## Lead Form Experience

The card uses English copy consistent with the rest of HTTP Scanner.

- Heading: `Need help fixing your security headers?`
- Supporting copy explains that the user can request paid help configuring their site's security.
- Editable fields:
  - required name;
  - required email address;
  - optional message.
- The scanned URL, score, report hash, and canonical report link are attached automatically and are not editable.
- A required checkbox states: `I agree to be contacted about paid security configuration support.`
- The submit action is labelled `Request paid help`.
- While submitting, the action is disabled to prevent accidental duplicates.
- Field validation is shown next to the relevant field and preserves the entered values.
- A network or server error leaves the form available and offers a retry.
- After a successful submission, the form is replaced with a confirmation message.

There is no privacy-policy page in the current site, so the consent text does not link to a nonexistent policy. Adding a policy page is outside this feature's scope.

## Client Components and Data Flow

`ReportView` selects the right-hand card based on the report score. The existing `SharingSection` remains responsible only for social sharing. A new, independently testable lead-form component owns form state, client validation, submission feedback, and non-sensitive analytics events.

The client submits the user's name, email, optional message, consent flag, report hash, and an empty honeypot field to `POST /api/leads`. It does not decide the authoritative scanned URL, score, or report link.

## Worker Endpoint and Validation

The Worker adds `POST /api/leads` using the project's Hono and layered architecture patterns. Server-side validation requires:

- a valid existing report hash;
- an authoritative report score below `80`;
- a non-empty, length-bounded name;
- a syntactically valid, length-bounded email address;
- a length-bounded optional message;
- explicit consent;
- an empty honeypot field.

The Worker loads the report by hash and derives the scanned URL, score, and canonical `https://httpscanner.com/report/{hash}` link itself. It rejects submissions for missing reports or reports scoring `80` or above, regardless of values sent by the browser. The email recipient and sender are server configuration and cannot be supplied by the request.

## D1 Persistence

A migration creates a dedicated `leads` table containing:

- generated lead ID;
- name and email;
- optional message;
- scanned URL;
- report hash and canonical report URL;
- report score;
- the consent text/version accepted by the user;
- email-delivery status and an optional failure reason suitable for operations;
- creation timestamp.

Indexes support listing by creation time and finding leads by email-delivery status. D1 is the source of truth: the Worker persists the lead before attempting email delivery.

## Email Notification

Cloudflare Email Service sends a notification to `pietrucha.bartosz+scanner@gmail.com` from `HTTP Scanner <scanner@httpscanner.com>`. The lead's submitted email is used as `Reply-To` so replying starts a conversation with the requester.

The notification includes the lead's contact details, optional message, scanned URL, score, and report link. The implementation must render user content safely and must not allow request data to control mail headers or the recipient.

If sending succeeds, the lead is marked as sent. If sending fails, the saved record remains available and is marked failed with a bounded operational error description. Because the D1 write already succeeded, the user receives a successful intake confirmation even when the notification fails. Automatic retries and an administrative lead-management UI are outside this iteration.

## Analytics and Privacy

PostHog records only these funnel events:

- `lead form viewed`;
- `lead submitted`;
- `lead submission failed`.

Analytics properties may include score and report hash but must not include name, email, message, consent text, scanned URL, or the full report URL. The D1 record contains only data needed to respond to the lead and operate email delivery; no IP address is persisted for this feature.

## Error Handling

- Client validation gives immediate, field-specific feedback.
- Server validation remains authoritative and returns stable error codes without echoing sensitive input.
- Duplicate button activation is prevented while a request is in flight.
- A failed D1 write returns an error and does not attempt email delivery.
- A failed email send is logged and reflected in D1 without deleting the lead.
- Operational logs avoid printing the submitted name, email, or message.

## Testing and Verification

Implementation follows test-driven development and covers:

- conditional rendering at scores `79.99` and `80`;
- the unchanged sharing card for qualifying reports;
- required fields, email syntax, consent, length limits, and honeypot validation;
- success, field-error, server-error, and duplicate-submit UI states;
- authoritative report lookup and canonical report-link generation;
- rejection of lead submissions for scores of `80` or above;
- persistence before notification;
- successful email status updates;
- retained D1 records and failed status after email errors;
- analytics payloads that exclude personal data.

Final verification runs the targeted tests, the complete test suite, `npm run lint`, `npm run build`, and `npm run deploy:dry`. Production deployment, D1 migration application, sender-domain verification, and production Email Service configuration require a separate explicit deployment decision.

## Out of Scope

- A privacy-policy page.
- An admin UI for viewing or managing leads.
- Automated email retries or queues.
- CRM synchronization.
- Changes to report sharing routes, image generation, or stored share images.
