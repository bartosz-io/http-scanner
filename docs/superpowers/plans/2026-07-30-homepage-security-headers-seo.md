# Homepage Security Headers SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen the statically rendered homepage for security-header checking intent while preserving the scanner-first experience and accurately describing the product's scope.

**Architecture:** Keep `src/pages/index.astro` responsible for page metadata, the hero, island placement, and section order. Move the longer server-rendered educational content into one Astro presentation component, and keep the displayed header groups in a small typed catalog that can be compared directly with the Worker parser registry in Vitest.

**Tech Stack:** Astro 7 static output, React 19 islands, TypeScript 5.7, Tailwind CSS 4, Vitest 4.

## Global Constraints

- Scope is homepage SEO only: do not add Academy, consulting, review, lead-generation, or sales CTAs.
- Keep `ScannerIsland` above all educational content and preserve `client:load`.
- Keep `RecentScansIsland` and preserve `client:visible`, but render it after the educational content.
- Render all new SEO copy as static Astro HTML; do not put it in a React island or load it after JavaScript.
- Keep `/` as the canonical path and preserve existing sitemap and analytics behavior.
- Target `security headers checker` as the primary query; use supporting phrases only where they read naturally.
- Do not position the product as a complete website vulnerability scanner or penetration test.
- List exactly the security headers registered in `worker/impl/parsers/security/index.ts`.
- Do not add `FAQPage` structured data.
- Add no runtime or development dependencies.
- Use the approved copy in `docs/superpowers/specs/2026-07-30-homepage-seo-design.md`; changes are limited to line wrapping and typographic punctuation required by HTML.

## File Structure

- Create `src/lib/homepageSeoContract.test.ts`: source and registry contract for homepage metadata, static rendering, section order, scope language, and the supported header list.
- Create `src/lib/homepageSecurityHeaders.ts`: typed display catalog for the four approved security-header groups.
- Create `src/components/astro/HomepageSeoContent.astro`: all static educational sections below the scanner and above recent scans.
- Modify `src/pages/index.astro`: approved metadata and hero copy, static content component placement, and recent-scans placement.

---

### Task 1: Give the homepage explicit security-headers-checker metadata and hero copy

**Files:**
- Create: `src/lib/homepageSeoContract.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `BaseLayout` props `title`, `description`, and `canonicalPath`
- Produces: the approved homepage title, meta description, H1, hero paragraph, and unchanged scanner hydration

- [ ] **Step 1: Write the failing metadata and hero contract**

Create `src/lib/homepageSeoContract.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homepageSource = readFileSync(
  new URL('../pages/index.astro', import.meta.url),
  'utf8'
);

describe('homepage SEO contract', () => {
  it('owns the security headers checker search intent', () => {
    expect(homepageSource).toContain(
      "const title = 'Security Headers Checker — Free HTTP Security Scan';"
    );
    expect(homepageSource).toContain(
      "const description = 'Check your website’s HTTP security headers for missing or weak CSP, HSTS, X-Frame-Options, Permissions-Policy and more. Get a free, actionable report.';"
    );
    expect(homepageSource).toContain('Free Security Headers Checker');
    expect(homepageSource).toContain(
      'Check the HTTP security headers of any public website.'
    );
  });

  it('keeps the canonical homepage and scanner-first interaction', () => {
    expect(homepageSource).toContain('canonicalPath="/"');
    expect(homepageSource).toContain('<ScannerIsland client:load />');

    const headingPosition = homepageSource.indexOf(
      'Free Security Headers Checker'
    );
    const scannerPosition = homepageSource.indexOf(
      '<ScannerIsland client:load />'
    );

    expect(headingPosition).toBeGreaterThan(-1);
    expect(scannerPosition).toBeGreaterThan(headingPosition);
  });
});
```

- [ ] **Step 2: Run the focused contract and confirm RED**

Run:

```bash
npm test -- src/lib/homepageSeoContract.test.ts
```

Expected: FAIL because the current title, description, H1, and hero paragraph
still use the old HTTP Scanner copy.

- [ ] **Step 3: Replace the metadata and hero copy**

In `src/pages/index.astro`, set:

```astro
---
import scannerLogo from '@/assets/scanner-logo.png';
import { RecentScansIsland } from '@/components/islands/RecentScansIsland';
import { ScannerIsland } from '@/components/islands/ScannerIsland';
import BaseLayout from '@/layouts/BaseLayout.astro';

const title = 'Security Headers Checker — Free HTTP Security Scan';
const description = 'Check your website’s HTTP security headers for missing or weak CSP, HSTS, X-Frame-Options, Permissions-Policy and more. Get a free, actionable report.';
---
```

Replace only the H1 and hero paragraph with:

```astro
<h1 class="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
  Free Security Headers Checker
</h1>
<p class="mx-auto mb-10 mt-5 max-w-2xl text-lg text-muted-foreground">
  Check the HTTP security headers of any public website. Find missing
  protections, risky configuration and information leaks, then get practical
  remediation guidance — no account required.
</p>
```

Keep `<ScannerIsland client:load />` directly after the paragraph.

- [ ] **Step 4: Run the focused contract and confirm GREEN**

Run:

```bash
npm test -- src/lib/homepageSeoContract.test.ts
```

Expected: PASS with 2 passing tests.

- [ ] **Step 5: Commit the metadata and hero change**

Run:

```bash
git add src/lib/homepageSeoContract.test.ts src/pages/index.astro
git commit -m "feat: target security headers checker intent"
```

Expected: one focused commit containing the test and homepage hero change.

---

### Task 2: Add the static homepage explanation and synchronized header catalog

**Files:**
- Create: `src/lib/homepageSecurityHeaders.ts`
- Create: `src/components/astro/HomepageSeoContent.astro`
- Modify: `src/lib/homepageSeoContract.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `securityHeaderParsers: Record<string, HeaderParser>` from `worker/impl/parsers/security/index.ts`
- Produces: `HomepageSecurityHeaderGroup` and `homepageSecurityHeaderGroups`, plus a static `HomepageSeoContent` Astro component

- [ ] **Step 1: Expand the contract for static content, section order, scope, and parser synchronization**

Replace `src/lib/homepageSeoContract.test.ts` with:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { securityHeaderParsers } from '../../worker/impl/parsers/security';
import { homepageSecurityHeaderGroups } from './homepageSecurityHeaders';

const homepageSource = readFileSync(
  new URL('../pages/index.astro', import.meta.url),
  'utf8'
);
const seoContentSource = readFileSync(
  new URL('../components/astro/HomepageSeoContent.astro', import.meta.url),
  'utf8'
);

describe('homepage SEO contract', () => {
  it('owns the security headers checker search intent', () => {
    expect(homepageSource).toContain(
      "const title = 'Security Headers Checker — Free HTTP Security Scan';"
    );
    expect(homepageSource).toContain(
      "const description = 'Check your website’s HTTP security headers for missing or weak CSP, HSTS, X-Frame-Options, Permissions-Policy and more. Get a free, actionable report.';"
    );
    expect(homepageSource).toContain('Free Security Headers Checker');
    expect(homepageSource).toContain(
      'Check the HTTP security headers of any public website.'
    );
  });

  it('keeps the canonical homepage and scanner-first interaction', () => {
    expect(homepageSource).toContain('canonicalPath="/"');
    expect(homepageSource).toContain('<ScannerIsland client:load />');

    const headingPosition = homepageSource.indexOf(
      'Free Security Headers Checker'
    );
    const scannerPosition = homepageSource.indexOf(
      '<ScannerIsland client:load />'
    );
    const contentPosition = homepageSource.indexOf('<HomepageSeoContent />');
    const recentScansPosition = homepageSource.indexOf(
      '<RecentScansIsland client:visible />'
    );

    expect(headingPosition).toBeGreaterThan(-1);
    expect(scannerPosition).toBeGreaterThan(headingPosition);
    expect(contentPosition).toBeGreaterThan(scannerPosition);
    expect(recentScansPosition).toBeGreaterThan(contentPosition);
  });

  it('renders the approved explanation as static Astro content', () => {
    expect(homepageSource).toContain('<HomepageSeoContent />');
    expect(homepageSource).not.toContain('<HomepageSeoContent client:');
    expect(seoContentSource).not.toContain('client:');

    for (const heading of [
      'What does the security headers checker do?',
      'Which security headers are checked?',
      'How to check your website’s security headers',
      'How to interpret the scan results',
      'What this security header scanner does not test',
      'Security headers FAQ',
    ]) {
      expect(seoContentSource, heading).toContain(heading);
    }
  });

  it('states the scanner boundary without FAQ structured data', () => {
    expect(seoContentSource).toContain(
      'not a complete website vulnerability scanner or penetration test'
    );
    expect(seoContentSource).toContain(
      'It does not prove that the website is free from vulnerabilities.'
    );
    expect(seoContentSource).not.toContain('FAQPage');
    expect(seoContentSource).not.toContain('application/ld+json');
  });

  it('lists every registered security parser exactly once', () => {
    const displayedHeaders = homepageSecurityHeaderGroups
      .flatMap((group) => group.headers)
      .map((header) => header.toLowerCase())
      .sort();
    const registeredHeaders = Object.keys(securityHeaderParsers).sort();

    expect(new Set(displayedHeaders).size).toBe(displayedHeaders.length);
    expect(displayedHeaders).toEqual(registeredHeaders);
  });
});
```

- [ ] **Step 2: Run the expanded contract and confirm RED**

Run:

```bash
npm test -- src/lib/homepageSeoContract.test.ts
```

Expected: FAIL during module resolution because
`src/lib/homepageSecurityHeaders.ts` and
`src/components/astro/HomepageSeoContent.astro` do not exist.

- [ ] **Step 3: Add the typed header display catalog**

Create `src/lib/homepageSecurityHeaders.ts`:

```ts
export interface HomepageSecurityHeaderGroup {
  title: string;
  description: string;
  headers: readonly string[];
}

export const homepageSecurityHeaderGroups = [
  {
    title: 'HTTPS and transport security',
    description:
      'Strict-Transport-Security helps browsers use encrypted HTTPS connections instead of falling back to insecure HTTP.',
    headers: ['Strict-Transport-Security'],
  },
  {
    title: 'Content and browser protections',
    description:
      'These headers restrict which resources can run, how the page may be embedded, what browser features it can use, and how referrer information is shared.',
    headers: [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ],
  },
  {
    title: 'Cross-origin isolation',
    description:
      'Cross-origin policies control how the document interacts with resources and browsing contexts served by other origins.',
    headers: [
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Embedder-Policy',
      'Cross-Origin-Resource-Policy',
      'Origin-Agent-Cluster',
    ],
  },
  {
    title: 'Site data and legacy browser controls',
    description:
      'These situational headers can clear local browser data or restrict behavior retained for compatibility with older clients and plugins.',
    headers: [
      'Clear-Site-Data',
      'X-Permitted-Cross-Domain-Policies',
      'X-DNS-Prefetch-Control',
    ],
  },
] as const satisfies readonly HomepageSecurityHeaderGroup[];
```

- [ ] **Step 4: Add the static Astro content component**

Create `src/components/astro/HomepageSeoContent.astro`:

```astro
---
import { homepageSecurityHeaderGroups } from '@/lib/homepageSecurityHeaders';
---

<section aria-labelledby="checker-purpose" class="container mx-auto px-4 py-14 sm:py-16">
  <div class="mx-auto max-w-3xl">
    <h2 id="checker-purpose" class="text-3xl font-semibold tracking-tight">
      What does the security headers checker do?
    </h2>
    <div class="mt-5 space-y-4 leading-7 text-muted-foreground">
      <p>
        HTTP security headers tell browsers how to handle your website and which
        potentially dangerous behaviors to restrict. A missing or weak header
        can leave users more exposed to attacks such as clickjacking, content
        injection or insecure transport.
      </p>
      <p>
        The scanner requests the public URL you provide, reads its HTTP response
        headers and evaluates the detected security controls. The resulting
        report highlights missing protections, risky values and information that
        may unnecessarily reveal details about the server.
      </p>
    </div>
  </div>
</section>

<section
  aria-labelledby="checked-headers"
  class="border-y border-border/60 bg-muted/30"
>
  <div class="container mx-auto px-4 py-14 sm:py-16">
    <div class="mx-auto max-w-3xl text-center">
      <h2 id="checked-headers" class="text-3xl font-semibold tracking-tight">
        Which security headers are checked?
      </h2>
      <p class="mt-4 leading-7 text-muted-foreground">
        The scan covers the following HTTP security headers. Some are
        recommended broadly, while others only apply to particular applications
        or response types.
      </p>
    </div>

    <div class="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
      {
        homepageSecurityHeaderGroups.map((group) => (
          <article class="rounded-lg border border-border bg-card p-6">
            <h3 class="text-lg font-semibold">{group.title}</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {group.description}
            </p>
            <ul class="mt-4 flex flex-wrap gap-2" aria-label={`${group.title} headers`}>
              {group.headers.map((header) => (
                <li>
                  <code class="break-all rounded-md bg-muted px-2.5 py-1 text-xs text-foreground">
                    {header}
                  </code>
                </li>
              ))}
            </ul>
          </article>
        ))
      }
    </div>
  </div>
</section>

<section aria-labelledby="how-to-check" class="container mx-auto px-4 py-14 sm:py-16">
  <div class="mx-auto max-w-5xl">
    <div class="mx-auto max-w-3xl text-center">
      <h2 id="how-to-check" class="text-3xl font-semibold tracking-tight">
        How to check your website’s security headers
      </h2>
    </div>

    <ol class="mt-10 grid gap-5 md:grid-cols-3">
      <li class="rounded-lg border border-border bg-card p-6">
        <span class="text-sm font-semibold text-muted-foreground">Step 1</span>
        <h3 class="mt-2 font-semibold">Enter a public website URL</h3>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          Provide the HTTPS or HTTP address you want to inspect.
        </p>
      </li>
      <li class="rounded-lg border border-border bg-card p-6">
        <span class="text-sm font-semibold text-muted-foreground">Step 2</span>
        <h3 class="mt-2 font-semibold">Run the security headers scan</h3>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          The scanner retrieves the response and analyzes the supported headers
          and their values.
        </p>
      </li>
      <li class="rounded-lg border border-border bg-card p-6">
        <span class="text-sm font-semibold text-muted-foreground">Step 3</span>
        <h3 class="mt-2 font-semibold">Review the actionable report</h3>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          See which protections passed, which require attention and how the
          configuration can be improved.
        </p>
      </li>
    </ol>
  </div>
</section>

<section
  aria-labelledby="scan-results"
  class="border-y border-border/60 bg-muted/30"
>
  <div class="container mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:py-16 lg:grid-cols-2">
    <article>
      <h2 id="scan-results" class="text-3xl font-semibold tracking-tight">
        How to interpret the scan results
      </h2>
      <div class="mt-5 space-y-4 leading-7 text-muted-foreground">
        <p>
          The report separates correctly detected protections from headers that
          are missing, weak or require review. It may also identify response
          headers that reveal unnecessary information about the server or
          application.
        </p>
        <p>
          A strong result means that the analyzed response has a solid
          browser-facing security configuration. It does not prove that the
          website is free from vulnerabilities. Security headers are one layer
          of defence and must be combined with secure application code, access
          control, dependency management and regular security testing.
        </p>
      </div>
    </article>

    <article class="rounded-lg border border-border bg-card p-6 sm:p-8">
      <h2 class="text-2xl font-semibold tracking-tight">
        What this security header scanner does not test
      </h2>
      <div class="mt-5 space-y-4 leading-7 text-muted-foreground">
        <p>
          This is a focused HTTP security header scanner, not a complete website
          vulnerability scanner or penetration test. It does not authenticate to
          your application, crawl every route, test business logic, exploit
          vulnerabilities or inspect server-side source code.
        </p>
        <p>
          Results apply to the public response returned for the scanned URL.
          Other pages, APIs and authenticated areas may return different headers
          and should be tested separately.
        </p>
      </div>
    </article>
  </div>
</section>

<section aria-labelledby="security-headers-faq" class="container mx-auto px-4 py-14 sm:py-16">
  <div class="mx-auto max-w-3xl">
    <h2 id="security-headers-faq" class="text-3xl font-semibold tracking-tight">
      Security headers FAQ
    </h2>

    <div class="mt-8 divide-y divide-border rounded-lg border border-border bg-card px-6">
      <article class="py-6">
        <h3 class="font-semibold">What are HTTP security headers?</h3>
        <p class="mt-2 leading-7 text-muted-foreground">
          HTTP security headers are response headers that instruct a browser to
          enforce protections such as HTTPS, content restrictions, framing
          controls and cross-origin isolation.
        </p>
      </article>
      <article class="py-6">
        <h3 class="font-semibold">
          How can I check my website’s security headers?
        </h3>
        <p class="mt-2 leading-7 text-muted-foreground">
          Enter a public URL into the scanner. It retrieves the HTTP response,
          identifies supported security headers and evaluates the values it
          receives.
        </p>
      </article>
      <article class="py-6">
        <h3 class="font-semibold">
          Which security headers should a website have?
        </h3>
        <p class="mt-2 leading-7 text-muted-foreground">
          The appropriate configuration depends on the application, but commonly
          relevant headers include Content-Security-Policy,
          Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy and
          Permissions-Policy.
        </p>
      </article>
      <article class="py-6">
        <h3 class="font-semibold">
          Does a high security headers score mean my website is secure?
        </h3>
        <p class="mt-2 leading-7 text-muted-foreground">
          No. It indicates that the analyzed response has stronger browser-facing
          controls. It does not test application logic, authentication,
          dependencies or server-side vulnerabilities.
        </p>
      </article>
      <article class="py-6">
        <h3 class="font-semibold">
          Can security headers prevent every web attack?
        </h3>
        <p class="mt-2 leading-7 text-muted-foreground">
          No. They can reduce the likelihood or impact of several browser-based
          attacks, but they are a defence-in-depth measure rather than a
          replacement for secure development and security testing.
        </p>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Replace the old three-card section and place recent scans last**

Replace `src/pages/index.astro` with:

```astro
---
import scannerLogo from '@/assets/scanner-logo.png';
import HomepageSeoContent from '@/components/astro/HomepageSeoContent.astro';
import { RecentScansIsland } from '@/components/islands/RecentScansIsland';
import { ScannerIsland } from '@/components/islands/ScannerIsland';
import BaseLayout from '@/layouts/BaseLayout.astro';

const title = 'Security Headers Checker — Free HTTP Security Scan';
const description = 'Check your website’s HTTP security headers for missing or weak CSP, HSTS, X-Frame-Options, Permissions-Policy and more. Get a free, actionable report.';
---

<BaseLayout title={title} description={description} canonicalPath="/">
  <section class="border-b border-border/60 bg-gradient-to-b from-muted/50 to-background">
    <div class="container mx-auto px-4 py-16 text-center sm:py-20">
      <div class="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
        <img src={scannerLogo.src} alt="" width="32" height="32" class="h-8 w-8" />
      </div>
      <h1 class="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
        Free Security Headers Checker
      </h1>
      <p class="mx-auto mb-10 mt-5 max-w-2xl text-lg text-muted-foreground">
        Check the HTTP security headers of any public website. Find missing
        protections, risky configuration and information leaks, then get practical
        remediation guidance — no account required.
      </p>

      <ScannerIsland client:load />
    </div>
  </section>

  <HomepageSeoContent />

  <div class="container mx-auto px-4">
    <RecentScansIsland client:visible />
  </div>
</BaseLayout>
```

- [ ] **Step 6: Run the focused contract and confirm GREEN**

Run:

```bash
npm test -- src/lib/homepageSeoContract.test.ts
```

Expected: PASS with 5 passing tests, including exact equality between the 13
displayed header names and the 13 Worker parser keys.

- [ ] **Step 7: Run the full automated verification**

Run each command separately:

```bash
npm test
npm run lint
npm run build
```

Expected:

- all Vitest files pass;
- ESLint exits with no errors;
- Astro check, TypeScript build, and Astro production build exit successfully;
- `dist/index.html` is generated.

- [ ] **Step 8: Verify that the approved content exists in generated HTML**

Run:

```bash
rg -n "Security Headers Checker — Free HTTP Security Scan|What does the security headers checker do\\?|Which security headers are checked\\?|What this security header scanner does not test|Security headers FAQ" dist/index.html
```

Expected: every phrase matches `dist/index.html`, proving that the copy is
present in the static artifact rather than depending on React hydration.

Run:

```bash
rg -n "FAQPage|application/ld\\+json" dist/index.html
```

Expected: no matches.

- [ ] **Step 9: Verify the page in a production-shaped local browser**

Start the two local processes in separate terminals:

```bash
npm run dev:worker
```

```bash
npm run dev:web
```

Open `http://localhost:4321/` and check at `1440x900` and `390x844`:

- there is one H1 and the URL input plus scan action appear before the first
  educational section;
- section headings follow the approved order;
- all 13 header labels wrap inside their cards without horizontal overflow;
- the FAQ answers are visible without interaction;
- recent scans render after the FAQ and still load through the Worker;
- submitting a public URL still starts a scan;
- browser console contains no new hydration, network, or accessibility errors.

- [ ] **Step 10: Commit the complete static homepage content**

Run:

```bash
git add src/components/astro/HomepageSeoContent.astro src/lib/homepageSecurityHeaders.ts src/lib/homepageSeoContract.test.ts src/pages/index.astro
git commit -m "feat: add homepage security headers SEO content"
```

Expected: one focused commit containing the static content component, typed
catalog, final contract, and homepage composition.

---

## Post-deployment Measurement

Deployment and Search Console submission are outside this implementation plan.
After an explicitly approved deployment:

1. Preserve the pre-change GSC baseline of 120 impressions and 0 clicks for the
   security-header query cluster.
2. Compare an equivalent 28-day window for an early directional result.
3. Evaluate the primary result after 6–8 weeks using homepage clicks,
   impressions, CTR, and average position for the whole query cluster.
4. Compare homepage organic entrances with the existing scanner-start event.
5. Avoid another homepage title or primary-copy change during the measurement
   window unless correcting a factual or technical defect.
