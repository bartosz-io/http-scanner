# Security Help Lead Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a paid-security-help lead form for reports scoring below 80, save every accepted lead in D1, and notify Bartosz through Cloudflare Email Service while preserving sharing for scores of 80 or more.

**Architecture:** A shared Zod contract validates browser input. The Worker resolves the report by hash, enforces eligibility, saves a pending lead through a D1 repository, then sends a safely rendered email through a notification port and records the result. A small React selector chooses the lead form or existing sharing card.

**Tech Stack:** TypeScript 5.7, React 19, Astro 7, Hono 4, Zod 3, React Hook Form, Cloudflare Workers, D1, Cloudflare Email Service, Vitest 4, Testing Library, Tailwind CSS.

## Global Constraints

- UI copy is English.
- `score < 80` shows only the lead form; `score >= 80` shows the unchanged sharing image and social actions.
- Collect required name and email, optional message, and required consent.
- The server derives scanned URL, score, report hash, and `https://httpscanner.com/report/{hash}`.
- D1 persistence completes before email is attempted.
- Notify `pietrucha.bartosz+scanner@gmail.com` from `HTTP Scanner <scanner@httpscanner.com>` with the lead email as `Reply-To`.
- PostHog never receives name, email, message, consent text, scanned URL, or full report URL.
- Do not persist IP addresses.
- Email failure preserves the lead and still returns intake success.
- Use 2-space indentation, semicolons, and single quotes in TypeScript.
- Do not deploy, mutate remote D1, or onboard email without separate authorization.

---

## File Responsibility Map

- `shared/leadSubmission.ts` owns the one request schema shared by browser and Worker.
- `worker/entities/Lead.ts` and `worker/interfaces/**/Lead*.ts` define the domain boundaries without Cloudflare details.
- `worker/impl/repositories/D1LeadRepository.ts` is the only lead-specific SQL adapter.
- `worker/impl/services/CloudflareLeadNotificationService.ts` is the only Email Service adapter and HTML renderer.
- `worker/usecases/SubmitLeadUseCase.ts` owns eligibility and persistence-before-notification order.
- `worker/impl/controllers/LeadController.ts` and `worker/routes/leadRoute.ts` own HTTP translation only.
- `src/lib/leadSubmissions.ts` owns the browser HTTP call.
- `src/components/report/LeadForm.tsx` owns form state and feedback.
- `src/components/report/ReportActionSection.tsx` owns the score threshold and delegates both card implementations.
- `sql/migrations/0001_create_leads.sql`, `wrangler.jsonc`, generated types, and README own platform setup.

---

### Task 1: Shared Request Contract

**Files:**
- Create: `shared/leadSubmission.ts`
- Create: `shared/leadSubmission.test.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `LEAD_CONSENT_VERSION`, `LEAD_FIELD_LIMITS`, `leadSubmissionSchema`, `LeadSubmissionRequestDTO`, `LeadSubmissionResponseDTO`.

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from 'vitest';
import { LEAD_FIELD_LIMITS, leadSubmissionSchema } from './leadSubmission';

const valid = {
  hash: '9249232fefb9a1c0455ba007d7784f6c',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Please help with CSP.',
  consent: true,
  website: '',
};

describe('leadSubmissionSchema', () => {
  it('trims and accepts valid input', () => {
    expect(leadSubmissionSchema.parse({ ...valid, name: ' Ada ' }).name).toBe('Ada');
  });

  it.each([
    { ...valid, name: '' },
    { ...valid, email: 'invalid' },
    { ...valid, consent: false },
    { ...valid, hash: 'bad' },
    { ...valid, website: 'bot.example' },
    { ...valid, message: 'x'.repeat(LEAD_FIELD_LIMITS.message + 1) },
  ])('rejects invalid input %#', (input) => {
    expect(leadSubmissionSchema.safeParse(input).success).toBe(false);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- shared/leadSubmission.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the contract**

```ts
import { z } from 'zod';
import { isValidReportHash } from './reportHash';

export const LEAD_CONSENT_VERSION = 'paid-security-contact-v1';
export const LEAD_FIELD_LIMITS = { name: 100, email: 254, message: 2000 } as const;

export const leadSubmissionSchema = z.object({
  hash: z.string().refine(isValidReportHash, 'Invalid report identifier.'),
  name: z.string().trim().min(1, 'Enter your name.').max(100),
  email: z.string().trim().email('Enter a valid email address.').max(254),
  message: z.string().trim().max(2000).default(''),
  consent: z.boolean().refine(Boolean, 'Consent is required.'),
  website: z.string().max(0, 'Invalid submission.').default(''),
});

export type LeadSubmissionRequestDTO = z.infer<typeof leadSubmissionSchema>;
export interface LeadSubmissionResponseDTO { accepted: true; leadId: string; }
```

Re-export the DTOs from `src/types.ts`:

```ts
export type {
  LeadSubmissionRequestDTO,
  LeadSubmissionResponseDTO,
} from '../shared/leadSubmission';
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- shared/leadSubmission.test.ts && npm run check`

```bash
git add shared/leadSubmission.ts shared/leadSubmission.test.ts src/types.ts
git commit -m "feat: add lead submission contract"
```

---

### Task 2: D1 Lead Persistence

**Files:**
- Create: `sql/migrations/0001_create_leads.sql`
- Create: `worker/entities/Lead.ts`
- Create: `worker/interfaces/repositories/LeadRepository.ts`
- Create: `worker/impl/repositories/D1LeadRepository.ts`
- Create: `worker/impl/repositories/D1LeadRepository.test.ts`

**Interfaces:**
- Produces: `Lead`, `LeadEmailStatus`, and `LeadRepository.save`, `markEmailSent`, `markEmailFailed`.

- [ ] **Step 1: Write failing repository tests**

Use a recording D1 test double for `prepare().bind().run()` and assert:

```ts
await repository.save(lead);
expect(db.calls[0].sql).toContain('INSERT INTO leads');
expect(db.calls[0].values).toEqual([
  lead.id, lead.name, lead.email, lead.message, lead.scannedUrl,
  lead.reportHash, lead.reportUrl, lead.score, lead.consentVersion, lead.createdAt,
]);
expect(db.calls[0].sql.toLowerCase()).not.toContain('ip');

await repository.markEmailSent(lead.id);
await repository.markEmailFailed(lead.id, 'E_DELIVERY_FAILED');
expect(db.calls.at(-1)?.values).toEqual(['E_DELIVERY_FAILED', lead.id]);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- worker/impl/repositories/D1LeadRepository.test.ts`

Expected: FAIL because the entity and repository do not exist.

- [ ] **Step 3: Add the migration**

```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK(length(email) BETWEEN 3 AND 254),
  message TEXT CHECK(message IS NULL OR length(message) <= 2000),
  scanned_url TEXT NOT NULL,
  report_hash TEXT NOT NULL,
  report_url TEXT NOT NULL,
  score REAL NOT NULL CHECK(score >= 0 AND score < 80),
  consent_version TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(email_status IN ('pending', 'sent', 'failed')),
  email_error TEXT CHECK(email_error IS NULL OR length(email_error) <= 100),
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email_status ON leads(email_status, created_at DESC);
```

- [ ] **Step 4: Add domain and repository contracts**

```ts
export type LeadEmailStatus = 'pending' | 'sent' | 'failed';
export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string | null;
  scannedUrl: string;
  reportHash: string;
  reportUrl: string;
  score: number;
  consentVersion: string;
  emailStatus: LeadEmailStatus;
  emailError: string | null;
  createdAt: number;
}
```

```ts
export interface LeadRepository {
  save(lead: Lead): Promise<void>;
  markEmailSent(id: string): Promise<void>;
  markEmailFailed(id: string, errorCode: string): Promise<void>;
}
```

- [ ] **Step 5: Implement positional D1 queries**

```ts
export class D1LeadRepository implements LeadRepository {
  constructor(private readonly db: D1Database) {}

  async save(lead: Lead): Promise<void> {
    await this.db.prepare(`
      INSERT INTO leads (
        id, name, email, message, scanned_url, report_hash,
        report_url, score, consent_version, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lead.id, lead.name, lead.email, lead.message, lead.scannedUrl,
      lead.reportHash, lead.reportUrl, lead.score, lead.consentVersion, lead.createdAt
    ).run();
  }

  async markEmailSent(id: string): Promise<void> {
    await this.db.prepare(
      `UPDATE leads SET email_status = 'sent', email_error = NULL WHERE id = ?`
    ).bind(id).run();
  }

  async markEmailFailed(id: string, errorCode: string): Promise<void> {
    await this.db.prepare(
      `UPDATE leads SET email_status = 'failed', email_error = ? WHERE id = ?`
    ).bind(errorCode.slice(0, 100), id).run();
  }
}
```

Never interpolate submitted values.

- [ ] **Step 6: Verify GREEN and local SQL**

```bash
npm test -- worker/impl/repositories/D1LeadRepository.test.ts
LEAD_D1_STATE=$(mktemp -d)
npx wrangler d1 migrations apply http_scanner_db --local --persist-to "$LEAD_D1_STATE"
```

Expected: test PASS and migrations 0000/0001 apply without SQL errors.

- [ ] **Step 7: Commit**

```bash
git add sql/migrations/0001_create_leads.sql worker/entities/Lead.ts worker/interfaces/repositories/LeadRepository.ts worker/impl/repositories/D1LeadRepository.ts worker/impl/repositories/D1LeadRepository.test.ts
git commit -m "feat: persist security help leads"
```

---

### Task 3: Cloudflare Email Adapter

**Files:**
- Create: `worker/interfaces/services/LeadNotificationService.ts`
- Create: `worker/impl/services/CloudflareLeadNotificationService.ts`
- Create: `worker/impl/services/CloudflareLeadNotificationService.test.ts`

**Interfaces:**
- Consumes: `Lead`, runtime `SendEmail`.
- Produces: `LeadNotificationService.send(lead)` and `buildLeadNotification(lead, config)`.

- [ ] **Step 1: Write failing notification tests**

```ts
const notification = buildLeadNotification({
  ...lead,
  name: '<img src=x>',
  message: '<script>alert(1)</script>',
}, config);
expect(notification.to).toBe('pietrucha.bartosz+scanner@gmail.com');
expect(notification.from).toEqual({ email: 'scanner@httpscanner.com', name: 'HTTP Scanner' });
expect(notification.replyTo).toBe(lead.email);
expect(notification.subject).toBe('New paid security help request');
expect(notification.html).toContain('&lt;script&gt;');
expect(notification.html).not.toContain('<script>');
expect(notification.text).toContain(lead.reportUrl);

const send = vi.fn(async () => ({ messageId: 'message-1' }));
await new CloudflareLeadNotificationService({ send }, config).send(lead);
expect(send).toHaveBeenCalledWith(buildLeadNotification(lead, config));
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- worker/impl/services/CloudflareLeadNotificationService.test.ts`

- [ ] **Step 3: Implement the port and adapter**

```ts
export interface LeadNotificationService { send(lead: Lead): Promise<void>; }
export interface LeadNotificationConfig {
  to: string;
  from: string;
  fromName: string;
}
```

Escape `&`, `<`, `>`, `"`, and `'` in all submitted HTML values. Produce both HTML and plain text. Omit an empty message. Call:

```ts
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

await this.email.send({
  to: this.config.to,
  from: { email: this.config.from, name: this.config.fromName },
  replyTo: lead.email,
  subject: 'New paid security help request',
  html,
  text,
});
```

If the binding rejects, throw only a provider code matching `/^E_[A-Z_]+$/`; otherwise throw `EMAIL_SEND_FAILED`. Do not propagate provider messages.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- worker/impl/services/CloudflareLeadNotificationService.test.ts && npm run check`

```bash
git add worker/interfaces/services/LeadNotificationService.ts worker/impl/services/CloudflareLeadNotificationService.ts worker/impl/services/CloudflareLeadNotificationService.test.ts
git commit -m "feat: send lead email notifications"
```

---

### Task 4: Persistence-First Use Case

**Files:**
- Create: `worker/usecases/SubmitLeadUseCase.ts`
- Create: `worker/usecases/SubmitLeadUseCase.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3 plus `ReportRepository.findByHash`.
- Produces: `execute(input): Promise<{ leadId: string }>`.

- [ ] **Step 1: Write failing orchestration tests**

Use in-memory ports to cover:

```ts
expect(events).toEqual(['report:find', 'lead:save', 'email:send', 'lead:sent']);
expect(savedLead).toMatchObject({
  scannedUrl: 'https://example.com/',
  reportUrl: `https://httpscanner.com/report/${valid.hash}`,
  score: 79.99,
  consentVersion: LEAD_CONSENT_VERSION,
  emailStatus: 'pending',
});
```

Also assert scores 80 and 100 throw `LEAD_NOT_ELIGIBLE` before save, a missing report throws `NOT_FOUND`, a save failure prevents email, and email failure resolves successfully after `markEmailFailed(id, 'E_DELIVERY_FAILED')`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- worker/usecases/SubmitLeadUseCase.test.ts`

- [ ] **Step 3: Implement orchestration**

```ts
const report = await this.reports.findByHash(input.hash);
if (!report) throw new Error('NOT_FOUND');
if (report.score >= 80) throw new Error('LEAD_NOT_ELIGIBLE');

const lead: Lead = {
  id: this.createId(),
  name: input.name,
  email: input.email,
  message: input.message || null,
  scannedUrl: report.url,
  reportHash: report.hash,
  reportUrl: `${this.publicBaseUrl}/report/${report.hash}`,
  score: report.score,
  consentVersion: LEAD_CONSENT_VERSION,
  emailStatus: 'pending',
  emailError: null,
  createdAt: this.now(),
};
await this.leads.save(lead);
try {
  await this.notifications.send(lead);
  await this.leads.markEmailSent(lead.id);
} catch (error) {
  const code = error instanceof Error && /^E_[A-Z_]+$/.test(error.message)
    ? error.message : 'EMAIL_SEND_FAILED';
  await this.leads.markEmailFailed(lead.id, code);
}
return { leadId: lead.id };
```

Constructor defaults: `createId = () => crypto.randomUUID()` and `now = () => Math.floor(Date.now() / 1000)`. Await notification and status update; do not add queues or retries.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- worker/usecases/SubmitLeadUseCase.test.ts`

```bash
git add worker/usecases/SubmitLeadUseCase.ts worker/usecases/SubmitLeadUseCase.test.ts
git commit -m "feat: orchestrate lead submissions"
```

---

### Task 5: HTTP Endpoint and Cloudflare Wiring

**Files:**
- Create: `worker/impl/controllers/LeadController.ts`
- Create: `worker/routes/leadRoute.ts`
- Create: `worker/routes/leadRoute.test.ts`
- Modify: `worker/impl/factories/DependencyFactory.ts`
- Modify: `worker/impl/middleware/errorHandler.ts`
- Modify: `worker/index.ts`
- Modify: `wrangler.jsonc`
- Modify: `worker-configuration.d.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: `POST /api/leads`, returning `201 { accepted: true, leadId }`.

- [ ] **Step 1: Write failing route tests**

Using injectable `createLeadRoute(createController)`, test valid input returns 201, malformed JSON and invalid fields return `400 INVALID_LEAD_SUBMISSION`, and `LEAD_NOT_ELIGIBLE` returns 400 without echoing the submitted email.

```ts
expect(await response.json()).toEqual({
  accepted: true,
  leadId: '7af46242-3570-4d9c-a08d-a70a07b9b817',
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- worker/routes/leadRoute.test.ts`

- [ ] **Step 3: Implement controller and stable errors**

The controller catches malformed JSON, uses `leadSubmissionSchema.safeParse`, throws `INVALID_LEAD_SUBMISSION`, calls the use case, and returns 201:

```ts
async handleSubmitLead(c: Context): Promise<Response> {
  const body = await c.req.json().catch(() => null);
  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) throw new Error('INVALID_LEAD_SUBMISSION');
  const result = await this.submitLead.execute(parsed.data);
  return c.json<LeadSubmissionResponseDTO>({
    accepted: true,
    leadId: result.leadId,
  }, 201);
}
```

Extract the existing app error response into reusable `mapErrorResponse(error, c)` and use it in the app and lead route:

```ts
export function createLeadRoute<Bindings extends object>(
  createController: (bindings: Bindings) => LeadController
): Hono<{ Bindings: Bindings }> {
  const route = new Hono<{ Bindings: Bindings }>();
  route.onError((error, c) => mapErrorResponse(error, c));
  route.post('/', (c) => createController(c.env).handleSubmitLead(c));
  return route;
}
```

Add mappings:

```ts
INVALID_LEAD_SUBMISSION: { status: 400, message: 'Check the lead form fields and try again' },
LEAD_NOT_ELIGIBLE: { status: 400, message: 'Paid help requests are available for reports scoring below 80' },
DATABASE_ERROR: { status: 500, message: 'An internal error occurred' },
```

- [ ] **Step 4: Wire factory and route**

Construct D1 report/lead repositories, Cloudflare notification service, and use case with `https://${env.CDN_DOMAIN}`. Mount:

```ts
api.route('/leads', createLeadRoute((env: Env) =>
  DependencyFactory.createLeadController(env)
));
```

- [ ] **Step 5: Configure restricted email and regenerate types**

Add to `wrangler.jsonc`:

```jsonc
"send_email": [{
  "name": "EMAIL",
  "destination_address": "pietrucha.bartosz+scanner@gmail.com",
  "allowed_sender_addresses": ["scanner@httpscanner.com"]
}],
```

Add `LEAD_NOTIFICATION_TO` and `LEAD_NOTIFICATION_FROM` to existing `vars`, preserving PostHog variables. Run `npm run cf-typegen`; confirm generated `Env` has `EMAIL: SendEmail` and both strings.

- [ ] **Step 6: Document manual production prerequisites**

README must state that `httpscanner.com` uses Cloudflare DNS, the domain must be onboarded for Email Sending, and the Gmail destination must be verified. Document without executing:

```bash
npx wrangler email sending list
npx wrangler email sending enable httpscanner.com
npx wrangler email sending dns get httpscanner.com
npx wrangler d1 migrations apply http_scanner_db --remote
```

- [ ] **Step 7: Verify GREEN and commit**

Run: `npm test -- worker/routes/leadRoute.test.ts worker/usecases/SubmitLeadUseCase.test.ts && npm run check`

```bash
git add worker/impl/controllers/LeadController.ts worker/routes/leadRoute.ts worker/routes/leadRoute.test.ts worker/impl/factories/DependencyFactory.ts worker/impl/middleware/errorHandler.ts worker/index.ts wrangler.jsonc worker-configuration.d.ts README.md
git commit -m "feat: expose lead submission endpoint"
```

---

### Task 6: Interactive Lead Form

**Files:**
- Create: `src/lib/leadSubmissions.ts`
- Create: `src/lib/leadSubmissions.test.ts`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/report/LeadForm.tsx`
- Create: `src/components/report/LeadForm.test.tsx`
- Modify: `src/types/reportTypes.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `submitLeadSubmission(input, fetcher?)` and `LeadForm({ hash, score, submit?, capture? })`.

- [ ] **Step 1: Install browser-test dependencies**

Run: `npm install --save-dev @testing-library/react @testing-library/user-event jsdom`

- [ ] **Step 2: Write failing API client tests**

Assert POST to `/api/leads` with JSON body, return parsed 201 response, and normalize non-2xx JSON errors to a safe `Error`.

```ts
expect(fetcher).toHaveBeenCalledWith('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(valid),
});
```

- [ ] **Step 3: Verify RED, implement, verify GREEN**

Run: `npm test -- src/lib/leadSubmissions.test.ts`

Implementation signature:

```ts
export async function submitLeadSubmission(
  input: LeadSubmissionRequestDTO,
  fetcher: typeof fetch = fetch
): Promise<LeadSubmissionResponseDTO>
```

Run the focused test again and require PASS.

- [ ] **Step 4: Write failing jsdom form tests**

With Testing Library and `userEvent`, test required name/email/consent, one request while pending, success replacement, retry with preserved values after error, hidden honeypot, and analytics calls containing exactly `{ hash, score }`. Assert the root has `ph-no-capture ph-mask`.

```tsx
expect(await screen.findByText('Your request has been received.')).toBeVisible();
expect(submit).toHaveBeenCalledOnce();
expect(screen.getByLabelText('Message')).toHaveValue('Help with CSP');
```

- [ ] **Step 5: Verify RED**

Run: `npm test -- src/components/report/LeadForm.test.tsx`

- [ ] **Step 6: Implement textarea and form**

Use `react-hook-form` with `zodResolver(leadSubmissionSchema)`. Defaults include hash, blank fields, `consent: false`, and blank `website`. Contract:

```ts
export interface LeadFormProps {
  hash: string;
  score: number;
  submit?: typeof submitLeadSubmission;
  capture?: typeof capturePostHogEvent;
}
```

Render approved copy, labels, max lengths, field errors, checkbox, inaccessible hidden honeypot, disabled submitting button, `Try again`, and success state. Capture `lead form viewed`, `lead submitted`, and `lead submission failed` with only `{ hash, score }`.

- [ ] **Step 7: Verify GREEN and commit**

Run: `npm test -- src/lib/leadSubmissions.test.ts src/components/report/LeadForm.test.tsx`

```bash
git add package.json package-lock.json src/lib/leadSubmissions.ts src/lib/leadSubmissions.test.ts src/components/ui/textarea.tsx src/components/report/LeadForm.tsx src/components/report/LeadForm.test.tsx src/types/reportTypes.ts
git commit -m "feat: add paid security help form"
```

---

### Task 7: Score-Based Report Integration

**Files:**
- Create: `src/components/report/ReportActionSection.tsx`
- Create: `src/components/report/ReportActionSection.test.tsx`
- Modify: `src/components/report/ReportView.tsx`
- Modify: `src/lib/analyticsSourceContract.test.ts`

**Interfaces:**
- Consumes: `LeadForm` and existing `SharingSection`.
- Produces: exact score-boundary selection.

- [ ] **Step 1: Write failing boundary tests**

```tsx
it.each([
  [0, 'Need help fixing your security headers?'],
  [79.99, 'Need help fixing your security headers?'],
  [80, 'Share Your Results'],
  [100, 'Share Your Results'],
])('selects the action at score %s', (score, heading) => {
  const html = renderToStaticMarkup(<ReportActionSection {...props} score={score} />);
  expect(html).toContain(heading);
});
```

For 79.99, also assert absence of `Share on LinkedIn`, `Share on Twitter`, and the share image URL.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/report/ReportActionSection.test.tsx`

- [ ] **Step 3: Implement selector and integrate ReportView**

```tsx
if (props.score < 80) return <LeadForm hash={props.hash} score={props.score} />;
return <SharingSection {...props} />;
```

Replace direct `SharingSection` in the existing right column. Do not modify `SharingSection.tsx` behavior or the responsive two-column layout.

- [ ] **Step 4: Extend analytics privacy contract**

Require the three lead event names, `ph-no-capture`, and `ph-mask`. Add a source-level assertion that lead capture calls do not provide `name`, `email`, `message`, `consent`, `url`, or `report_url` properties.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```bash
npm test -- src/components/report/ReportActionSection.test.tsx src/components/report/LeadForm.test.tsx src/lib/leadSubmissions.test.ts src/lib/analyticsSourceContract.test.ts
```

```bash
git add src/components/report/ReportActionSection.tsx src/components/report/ReportActionSection.test.tsx src/components/report/ReportView.tsx src/lib/analyticsSourceContract.test.ts
git commit -m "feat: target security help by report score"
```

---

### Task 8: Full Verification

**Files:**
- Verify only; do not mutate production.

- [ ] **Step 1: Verify a fresh local D1 migration**

```bash
LEAD_D1_VERIFY=$(mktemp -d)
npx wrangler d1 migrations apply http_scanner_db --local --persist-to "$LEAD_D1_VERIFY"
npx wrangler d1 execute http_scanner_db --local --persist-to "$LEAD_D1_VERIFY" --command "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'leads'"
```

Expected: one `leads` row.

- [ ] **Step 2: Run all checks**

```bash
npm test
npm run lint
npm run build
npm run deploy:dry
git diff --check
```

Expected: every command exits 0; dry-run lists DB and EMAIL bindings but deploys nothing.

- [ ] **Step 3: Audit privacy-sensitive sources**

```bash
rg -n "capturePostHogEvent|console\.(log|error)|LEAD_NOTIFICATION_(TO|FROM)|send_email" src worker wrangler.jsonc
```

Expected: lead analytics contain only hash/score, no Worker log prints lead fields, and email endpoints are fixed server configuration.

- [ ] **Step 4: Handoff production gates**

Report these unexecuted operator actions: verify the Gmail destination, onboard `httpscanner.com` and confirm SPF/DKIM/DMARC, apply `0001_create_leads.sql` remotely, then deploy the Worker.

---

## Primary Platform References

- <https://developers.cloudflare.com/email-service/api/send-emails/workers-api/>
- <https://developers.cloudflare.com/email-service/configuration/send-bindings/>
- <https://developers.cloudflare.com/email-service/get-started/send-emails/>
- <https://developers.cloudflare.com/d1/reference/migrations/>
