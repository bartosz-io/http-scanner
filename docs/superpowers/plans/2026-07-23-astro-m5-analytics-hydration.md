# Astro M5 Analytics and Hydration Implementation Plan

> **For Codex:** REQUIRED SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Preserve the existing PostHog funnel after the Astro migration, add durable SEO acquisition attribution, prevent delete secrets from entering analytics, and verify that the Astro islands hydrate without browser errors.

**Architecture:** Browser analytics remains a framework-independent module used directly by each React island. A small session-attribution module records the first landing URL/path/referrer for the browser tab and appends it to explicit application events. A pure privacy filter is installed as PostHog's `before_send` hook so both explicit and automatic events are scrubbed before transport. Astro documents initialize PostHog once; the legacy Vite entrypoint no longer owns a React provider.

**Tech Stack:** Astro 7, React 19 islands, TypeScript, `posthog-js`, Vitest, Playwright CLI.

---

## Task 1: Lock the M5 analytics contract in tests

**Files:**
- Create: `src/lib/analyticsAttribution.test.ts`
- Create: `src/lib/analyticsPrivacy.test.ts`
- Modify: `src/lib/posthogClient.test.ts`
- Create: `src/lib/analyticsSourceContract.test.ts`

**Step 1: Write failing attribution tests**

Cover these rules:

- The landing page contains only `origin + pathname`; query parameters and hashes are excluded.
- The landing path contains only `pathname`.
- The referrer contains only `origin + pathname`; an empty or invalid referrer becomes `null`.
- The first attribution object stored in `sessionStorage` is reused on a later report document.
- Unavailable or throwing storage falls back to a safe in-memory result without breaking event capture.

**Step 2: Write failing privacy tests**

Cover these rules recursively for objects and arrays:

- Property keys containing `token`, case-insensitively, are removed.
- URL strings have `token` and `deleteToken` query parameters removed, case-insensitively.
- Safe query parameters and ordinary event properties remain unchanged.
- PostHog capture results keep their event name and safe properties.

**Step 3: Extend the PostHog client tests**

Mock `posthog-js` and verify:

- prerendering remains a no-op;
- browser initialization happens only once;
- the configuration uses exactly one initial document pageview (`capture_pageview: true`);
- `before_send` is the privacy filter;
- explicit event properties retain their existing keys and gain `landing_page`, `landing_path`, and `referrer`.

**Step 4: Add a static source contract test**

Assert that:

- `src/` contains no `PostHogProvider` or `usePostHog` usage;
- delete-token UI fields/renderers carry `ph-no-capture` and `ph-mask`;
- the known event names remain present: `scan submitted`, `scan failed`, `url scanned`, `report viewed`, `report shared`, `delete report initiated`, `delete report failed`, and `report deleted`.

**Step 5: Run the focused tests and confirm RED**

Run:

```bash
npm test -- src/lib/analyticsAttribution.test.ts src/lib/analyticsPrivacy.test.ts src/lib/posthogClient.test.ts src/lib/analyticsSourceContract.test.ts
```

Expected: failures because the attribution/privacy modules and provider removal do not exist yet.

## Task 2: Implement session attribution and privacy filtering

**Files:**
- Create: `src/lib/analyticsAttribution.ts`
- Create: `src/lib/analyticsPrivacy.ts`

**Step 1: Implement URL reduction helpers**

Create pure helpers that accept an absolute URL-like string and return only `origin + pathname`. They must return `null` for invalid/empty external input and never retain search/hash data.

**Step 2: Implement session attribution**

Define:

```ts
type AnalyticsAttribution = {
  landing_page: string;
  landing_path: string;
  referrer: string | null;
};
```

Use one namespaced `sessionStorage` key. Read and validate an existing value before creating a new attribution object from `window.location` and `document.referrer`. Catch storage access/JSON errors.

**Step 3: Implement recursive analytics sanitization**

Create a pure `sanitizeAnalyticsValue` helper and a PostHog-compatible `sanitizePostHogCapture` callback. Remove token-named keys and strip secret query parameters from URL strings while preserving all safe fields.

**Step 4: Run the focused attribution/privacy tests**

Expected: attribution and privacy suites pass; client/source contract suites may still fail.

## Task 3: Integrate framework-independent PostHog initialization

**Files:**
- Modify: `src/lib/posthogClient.ts`
- Modify: `src/main.tsx`

**Step 1: Append attribution to explicit events**

In `capturePostHogEvent`, merge the session attribution with the event-specific properties. Event-specific properties keep their current names and values.

**Step 2: Make automatic pageview behavior explicit**

Initialize `posthog-js` with:

- the existing project token, host, defaults date, and tracing-header configuration;
- `capture_pageview: true`, yielding one initial pageview for each Astro document;
- `before_send: sanitizePostHogCapture`.

Retain the `posthog.__loaded` guard and do not add a manual `$pageview` capture.

**Step 3: Remove the legacy React provider**

Remove `PostHogProvider` and provider-owned initialization from `src/main.tsx`. Leave dependency removal and deletion of the legacy Vite entrypoint to M6, as specified by the migration plan.

**Step 4: Run the focused PostHog/source tests**

Expected: all focused M5 tests pass.

## Task 4: Mask every delete-token UI surface

**Files:**
- Modify: `src/components/report/DeleteConfirmationModal.tsx`
- Modify: `src/components/report/ReportHeader.tsx`

**Step 1: Add PostHog privacy classes**

Add both `ph-no-capture` and `ph-mask` to the delete-token input. Add them to the optional legacy delete-token rendering in `ReportHeader` so no currently reachable or compatibility UI can be recorded.

**Step 2: Re-run the source contract test**

Expected: the token-mask assertions pass.

## Task 5: Verify browser behavior and secret handling

**Files:**
- Create: `docs/astro-migration-m5.md`
- Modify: `docs/astro-migration-plan.md`

**Step 1: Start the Astro frontend and local Worker**

Run the established local M4/M5 development commands on ports 4321 and 8787.

**Step 2: Verify hydration**

With Playwright CLI, load:

- homepage `/`;
- a valid `/report/:hash`;
- a valid `/report/:hash?token=<32-character-token>`.

Check browser console output for hydration errors and confirm the token is removed from the address bar before analytics initialization.

**Step 3: Verify analytics requests**

Use browser network inspection or a controlled PostHog test double to confirm:

- one `$pageview` per loaded Astro document;
- `scan submitted`, server-side `url scanned`, and `report viewed` retain their established property contracts;
- explicit browser events have the session landing/referrer fields;
- no captured payload contains the delete token or a full report URL containing it.

**Step 4: Document evidence**

Record commands, observed event flow, privacy checks, pageview count, and hydration results in `docs/astro-migration-m5.md`. Mark M5 checklist and status as complete only after all checks pass.

## Task 6: Run the M5 quality gate

**Files:**
- Modify only if verification uncovers defects.

**Step 1: Run all automated checks**

Run:

```bash
npm test
npm run lint
npm run check
npm run build:astro
```

Expected: all commands exit successfully.

**Step 2: Inspect the worktree**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only intentional M5 implementation, tests, and documentation changes; no generated artifacts or secrets.

**Step 3: Stop before committing**

Do not commit or push M5 in this task. Wait for the user's explicit commit-and-push request.
