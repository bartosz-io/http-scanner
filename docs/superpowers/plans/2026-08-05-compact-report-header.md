# Compact Report Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tall, left-aligned report heading and separate view switch with one compact responsive summary bar.

**Architecture:** Add a focused `ReportSummaryBar` component that composes the existing report identity and view switch. Keep formatting inside `ReportHeader`, switching behavior inside `ReportViewSwitch`, and data/loading/error behavior inside `ReportView`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, user-event

## Global Constraints

- Desktop shows report title and metadata on the left and the existing view switch on the right.
- Mobile stacks the switch below the metadata and does not create horizontal overflow.
- The URL stays fully available in the DOM while truncating visually when necessary.
- Delete-token warnings remain separate and full width below the compact bar.
- Loading, errors, analytics, report data, view selection, and report cards remain unchanged.

---

### Task 1: Compose and integrate the compact report summary bar

**Files:**
- Create: `src/components/report/ReportSummaryBar.tsx`
- Create: `src/components/report/ReportSummaryBar.test.tsx`
- Modify: `src/components/report/ReportHeader.tsx`
- Modify: `src/components/report/ReportView.tsx`

**Interfaces:**
- `ReportSummaryBarProps = Pick<ReportHeaderProps, 'url' | 'createdAt'> & ReportViewSwitchProps`
- `ReportSummaryBar` preserves `ReportViewSwitch` values and `onChange` behavior.

- [ ] **Step 1: Write the failing component tests**

Create tests that render `ReportSummaryBar`, verify its heading, URL, timestamp, view group, responsive grid classes, and existing switch callback:

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportSummaryBar } from './ReportSummaryBar';

afterEach(cleanup);

describe('ReportSummaryBar', () => {
  it('combines report identity and view controls in a responsive bar', () => {
    render(
      <ReportSummaryBar
        url="https://gdanskiewakacje.pl"
        createdAt={1785861751}
        value="security-analysis"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Security Scan Report' })).not.toBeNull();
    expect(screen.getByText('https://gdanskiewakacje.pl')).not.toBeNull();
    expect(screen.getByRole('group', { name: 'Report view' })).not.toBeNull();
    expect(screen.getByTestId('report-summary-bar').className).toContain('lg:grid-cols-[minmax(0,1fr)_auto]');
  });

  it('preserves report view switching', async () => {
    const onChange = vi.fn();
    render(
      <ReportSummaryBar
        url="https://example.com"
        createdAt={1785861751}
        value="security-analysis"
        onChange={onChange}
      />
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'All response headers' }));
    expect(onChange).toHaveBeenCalledWith('all-headers');
  });
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/components/report/ReportSummaryBar.test.tsx`

Expected: FAIL because `ReportSummaryBar` does not exist.

- [ ] **Step 3: Implement the component and compact metadata layout**

Create `ReportSummaryBar.tsx`:

```tsx
import type { ReportHeaderProps, ReportViewSwitchProps } from '@/types/reportTypes';
import { ReportHeader } from './ReportHeader';
import { ReportViewSwitch } from './ReportViewSwitch';

type ReportSummaryBarProps = Pick<ReportHeaderProps, 'url' | 'createdAt'> &
  ReportViewSwitchProps;

export function ReportSummaryBar({
  url,
  createdAt,
  value,
  onChange,
}: ReportSummaryBarProps) {
  return (
    <div
      data-testid="report-summary-bar"
      className="grid items-center gap-4 border-b pb-4 lg:grid-cols-[minmax(0,1fr)_auto]"
    >
      <ReportHeader url={url} createdAt={createdAt} />
      <ReportViewSwitch value={value} onChange={onChange} />
    </div>
  );
}
```

Update the main content in `ReportHeader` to use a compact metadata line:

```tsx
<div className="min-w-0 space-y-1.5">
  <h1 className="text-2xl font-bold">Security Scan Report</h1>
  <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
    <div className="min-w-0 max-w-full truncate font-medium" title={url}>
      {url}
    </div>
    <div className="text-sm text-muted-foreground">Scanned {formattedDate}</div>
  </div>
</div>
```

Preserve the existing delete-token alert after this identity block.

- [ ] **Step 4: Integrate the bar in ReportView**

Replace the separate `ReportHeader` and `ReportViewSwitch` nodes with:

```tsx
<ReportSummaryBar
  url={report.url}
  createdAt={report.created_at}
  value={view}
  onChange={onViewChange}
/>
```

Keep `TokenWarningAlert` immediately after the summary bar. Reduce the report content wrapper from `space-y-8` to `space-y-6` so the first report card moves upward without changing card internals.

- [ ] **Step 5: Run focused and contract tests**

Run:

```bash
npm test -- src/components/report/ReportSummaryBar.test.tsx src/lib/allHeadersReportContract.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 6: Run full verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all tests pass, lint has no errors, and build exits successfully.

- [ ] **Step 7: Browser QA**

- Verify a desktop report uses the full-width compact bar and report cards begin materially higher.
- Verify both report-view buttons still switch content.
- Verify a 390px viewport stacks controls with `scrollWidth === innerWidth`.
- Verify a token warning remains below the bar when that state is available.
- Do not submit a lead.

- [ ] **Step 8: Commit**

```bash
git add src/components/report/ReportSummaryBar.tsx src/components/report/ReportSummaryBar.test.tsx src/components/report/ReportHeader.tsx src/components/report/ReportView.tsx
git commit -m "feat: compact report summary header"
```
