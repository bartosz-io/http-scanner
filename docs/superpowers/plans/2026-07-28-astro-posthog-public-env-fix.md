# Astro PostHog Public Environment Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Astro browser bundle receive the PostHog project token and host, and preserve PostHog's required transport token, so client-side pageviews and funnel events are actually sent.

**Architecture:** Keep Worker analytics on the existing `POSTHOG_*` bindings. Rename only browser-build variables from the legacy Vite-specific `VITE_PUBLIC_POSTHOG_*` names to Astro's public `PUBLIC_POSTHOG_*` names. Preserve the SDK-owned `properties.token` in `before_send` while filtering application secrets, then verify the source contract, emitted Astro bundle and hosted funnel.

**Tech Stack:** Astro 7, Vite 8, TypeScript, Vitest, PostHog JS.

## Global Constraints

- Do not expose Worker-only variables or configure an empty Vite `envPrefix`.
- Do not rename `POSTHOG_PROJECT_TOKEN` or `POSTHOG_HOST` used by the Worker.
- The PostHog project token is public client configuration but its value must not be printed in test output or documentation.
- Do not commit or push; the user handles milestone commits in a separate step.

---

### Task 1: Add the Astro environment regression contract

**Files:**
- Modify: `src/lib/posthogClient.test.ts`

**Interfaces:**
- Consumes: browser analytics initialization in `src/lib/posthogClient.ts`
- Produces: a behavior-level contract requiring `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST`

- [x] **Step 1: Rename only the test environment stubs**

Change the PostHog client test stubs to `PUBLIC_POSTHOG_PROJECT_TOKEN` and
`PUBLIC_POSTHOG_HOST`. The assertions continue to exercise the real
`initializePostHog()` and `capturePostHogEvent()` behavior. Do not change
production code yet.

- [x] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npm test -- src/lib/posthogClient.test.ts
```

Expected: browser initialization and event capture tests fail because
production code still reads `VITE_PUBLIC_POSTHOG_*`.

### Task 2: Rename the browser build variables

**Files:**
- Modify: `src/lib/posthogClient.ts`
- Modify: `.env.local`

**Interfaces:**
- Consumes: Astro's public `import.meta.env.PUBLIC_*` convention
- Produces: a non-null PostHog browser client when public build configuration is present

- [x] **Step 1: Update production reads**

Read `import.meta.env.PUBLIC_POSTHOG_PROJECT_TOKEN` and
`import.meta.env.PUBLIC_POSTHOG_HOST`.

- [x] **Step 2: Migrate local build configuration**

Rename the two keys in `.env.local` without changing their values. Keep
Worker keys in `.dev.vars` unchanged.

- [x] **Step 3: Run focused tests and confirm GREEN**

Run:

```bash
npm test -- src/lib/posthogClient.test.ts
```

Expected: both suites pass.

### Task 3: Verify the emitted Astro bundle and correct M5 evidence

**Files:**
- Modify: `docs/astro-migration-m5.md`
- Modify: `docs/astro-migration-plan.md` only if live verification still fails

**Interfaces:**
- Consumes: `npm run build:astro` output in `dist-astro/_astro`
- Produces: evidence that the configured token reaches the browser bundle

- [x] **Step 1: Build Astro**

Run:

```bash
npm run build:astro
```

Expected: build succeeds.

- [x] **Step 2: Compare configuration propagation without printing values**

Load `.env.local`, search for the configured token as a fixed string, and
print only `present` or `absent`.

Expected:

```text
astro-client-bundle: token present
```

- [x] **Step 3: Run the local browser funnel**

Verify homepage hydration, one initial PostHog pageview, `scan submitted`,
`url scanned`, and `report viewed`. Confirm no token-bearing URL is captured.

- [x] **Step 4: Correct the M5 verification document**

Remove the inaccurate statement blaming the controlled browser. Record the
environment-prefix root cause, the fix, and the new live verification result.

- [x] **Step 5: Run the full quality gate**

Run:

```bash
npm test
npm run lint
npm run check
npm run build:astro
npm run build:legacy
git diff --check
```

Expected: all commands exit successfully; lint may retain the seven documented
legacy warnings.

### Task 4: Preserve PostHog's SDK transport token

**Files:**
- Modify: `src/lib/analyticsPrivacy.test.ts`
- Modify: `src/lib/analyticsPrivacy.ts`

- [x] **Step 1: Add a regression test and confirm RED**

Model the real PostHog capture envelope with `properties.token`. Require the
transport token to remain while nested application token fields are removed.

- [x] **Step 2: Preserve only the SDK-owned token and confirm GREEN**

Restore the original `capture.properties.token` after recursively sanitizing
the envelope. Do not exempt any nested or application-owned token fields.

- [x] **Step 3: Verify real delivery**

Enable PostHog debug mode locally, confirm the SDK logs `send "$pageview"`
without a missing-token rejection, then verify the correlated local funnel in
the hosted `Http Scanner` project.
