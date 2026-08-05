# Compact Lead Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the paid-help form fit the adjacent scoring card by default, with Name and Email sharing a desktop row and Message revealed only through an `Add custom message` checkbox.

**Architecture:** Keep the change inside the existing `LeadForm` component and its component test. A local boolean controls conditional Message rendering; collapsing the field clears the React Hook Form value so the existing API contract continues to receive an empty string when no custom message is requested.

**Tech Stack:** React 19, TypeScript, React Hook Form, Tailwind CSS, Vitest, Testing Library, user-event

## Global Constraints

- Name and Email render in two columns on medium and larger screens and stack on smaller screens.
- The default card uses natural height and should fit within the adjacent scoring card; validation errors and expanded optional content may increase its height.
- Message remains optional and keeps its 2,000-character limit.
- Collapsing Message clears its value before submission.
- Name, Email, and contact consent remain required.
- Preserve duplicate-submission protection, success and retry states, honeypot behavior, PostHog privacy classes, and non-PII analytics.

---

### Task 1: Compact and progressively disclose the lead form

**Files:**
- Modify: `src/components/report/LeadForm.tsx`
- Test: `src/components/report/LeadForm.test.tsx`

**Interfaces:**
- Consumes: existing `LeadForm(props: LeadFormProps)` and `form.setValue('message', value)` from React Hook Form.
- Produces: unchanged `LeadForm` public interface and unchanged `LeadSubmissionRequestDTO` payload shape.

- [ ] **Step 1: Write failing tests for the complete compact-form behavior**

First update the existing helper so tests that intentionally include a message explicitly opt in:

```tsx
async function revealMessage(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('checkbox', { name: 'Add custom message' }));
  return screen.getByLabelText('Message') as HTMLTextAreaElement;
}

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  const message = await revealMessage(user);
  await user.type(message, 'Help with CSP');
  await user.click(screen.getByRole('checkbox', {
    name: 'I agree to be contacted about paid security configuration support.',
  }));
  return user;
}
```

Update the field-limit test to call `revealMessage(user)` before asserting the Message limit. Add tests that assert Message is absent initially, the reveal checkbox is visible, and the Name/Email wrapper carries responsive grid classes:

```tsx
it('starts compact with name and email in a responsive row', () => {
  render(<LeadForm hash={HASH} score={SCORE} submit={vi.fn()} capture={vi.fn()} />);

  expect(screen.getByRole('checkbox', { name: 'Add custom message' })).not.toBeNull();
  expect(screen.queryByLabelText('Message')).toBeNull();

  const identityFields = screen.getByTestId('lead-identity-fields');
  expect(identityFields.classList.contains('md:grid-cols-2')).toBe(true);
});
```

Add the interaction and payload tests:

```tsx
it('reveals the optional message and clears it when collapsed', async () => {
  const user = userEvent.setup();
  render(<LeadForm hash={HASH} score={SCORE} submit={vi.fn()} capture={vi.fn()} />);

  const message = await revealMessage(user);
  await user.type(message, 'Help with CSP');
  await user.click(screen.getByRole('checkbox', { name: 'Add custom message' }));
  expect(screen.queryByLabelText('Message')).toBeNull();

  const reopenedMessage = await revealMessage(user);
  expect(reopenedMessage.value).toBe('');
});

it('submits an empty message when custom message is not enabled', async () => {
  const submit = vi.fn().mockResolvedValue(ACCEPTED);
  const user = userEvent.setup();
  render(<LeadForm hash={HASH} score={SCORE} submit={submit} capture={vi.fn()} />);
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.click(screen.getByRole('checkbox', {
    name: 'I agree to be contacted about paid security configuration support.',
  }));
  await user.click(screen.getByRole('button', { name: 'Request paid help' }));

  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({
    message: '',
  })));
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/report/LeadForm.test.tsx`

Expected: FAIL because `Add custom message` and `lead-identity-fields` do not exist and Message is currently rendered.

- [ ] **Step 3: Implement the compact layout and optional Message behavior**

In `LeadForm`, add local state and group the existing Name and Email fields:

```tsx
const [showMessage, setShowMessage] = useState(false);

<div
  data-testid="lead-identity-fields"
  className="grid gap-3 md:grid-cols-2"
>
  {/* existing Name FormField */}
  {/* existing Email FormField */}
</div>
```

Replace the always-visible Message field with a native checkbox and conditional field:

```tsx
<label className="flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    className="size-4"
    checked={showMessage}
    onChange={(event) => {
      const checked = event.target.checked;
      setShowMessage(checked);
      if (!checked) {
        form.setValue('message', '', { shouldDirty: true, shouldValidate: true });
      }
    }}
  />
  <span>Add custom message</span>
</label>

{showMessage && (
  <FormField
    control={form.control}
    name="message"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Message</FormLabel>
        <FormControl>
          <Textarea
            maxLength={LEAD_FIELD_LIMITS.message}
            placeholder="What would you like help with?"
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

Reduce default vertical spacing without changing the card structure:

```tsx
<div className="flex-grow p-4 sm:p-5">
  <p className="text-muted-foreground mb-3 text-sm">...</p>
  <form className="space-y-3" ...>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/components/report/LeadForm.test.tsx`

Expected: all `LeadForm` tests pass, including compact state, expanding and clearing Message, submission with and without Message, retry, privacy, and analytics.

- [ ] **Step 5: Run the full verification suite**

Run:

```bash
npm test -- src/components/report/LeadForm.test.tsx
npm test
npm run lint
npm run build
```

Expected: all tests pass, lint has no errors, and the production build exits successfully.

- [ ] **Step 6: Verify the responsive UI in a browser**

- Open a low-score report at desktop width and confirm the default lead card is no taller than the scoring card.
- Confirm Name and Email share one row.
- Toggle `Add custom message` and confirm the card expands with Message.
- Set a mobile viewport and confirm Name and Email stack with no horizontal overflow.
- Do not submit a real lead during visual verification.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/components/report/LeadForm.tsx src/components/report/LeadForm.test.tsx
git commit -m "fix: compact security help lead form"
```
