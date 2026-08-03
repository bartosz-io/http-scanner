# Header Analysis Visual Emphasis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make report header names visually stronger and show an always-visible item count on every HTTP header category tab.

**Architecture:** `HeadersSection` owns the header arrays, derives their lengths, and passes a typed count record into the presentational `HeaderTabs` component. `HeaderCard` keeps its existing structure and changes only the title typography for both evaluated and not-evaluated variants.

**Tech Stack:** React 19, TypeScript, Radix UI tabs, Tailwind CSS, Vitest, React server rendering.

## Global Constraints

- Render counts for Detected, Missing, and Leaking.
- Always render the count, including zero, for example `Leaking (0)`.
- Counts describe the complete arrays behind the top-level tabs and are independent of secondary status filters.
- Keep the current header-name size, layout, icon, and card structure unchanged.
- Use bold weight and the strongest existing slate text color for header names.

---

### Task 1: Header category counts and title emphasis

**Files:**
- Create: `src/components/report/HeaderAnalysisVisualEmphasis.test.tsx`
- Modify: `src/types/reportTypes.ts:75-78`
- Modify: `src/components/report/HeadersSection.tsx:12-34`
- Modify: `src/components/report/HeaderTabs.tsx:8-35`
- Modify: `src/components/report/HeaderCard.tsx:176-182,220-226`

**Interfaces:**
- Consumes: `headers.detected`, `headers.missing`, and `headers.leaking` as `HeaderEntry[]` from `HeadersSectionProps`.
- Produces: `HeaderTabsProps.counts: Record<HeaderTabType, number>`.
- Produces: tab labels in the exact visible format `Detected (n)`, `Missing (n)`, and `Leaking (n)`.

- [ ] **Step 1: Write failing component tests for counts and title emphasis**

Create `src/components/report/HeaderAnalysisVisualEmphasis.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeaderTabType } from '@/types/reportTypes';
import { HeaderCard } from './HeaderCard';
import { HeaderTabs } from './HeaderTabs';

describe('header analysis visual emphasis', () => {
  it('shows a count for every header category, including zero', () => {
    const html = renderToStaticMarkup(
      <HeaderTabs
        activeTab={HeaderTabType.DETECTED}
        onTabChange={() => undefined}
        counts={{
          [HeaderTabType.DETECTED]: 9,
          [HeaderTabType.MISSING]: 5,
          [HeaderTabType.LEAKING]: 0,
        }}
      />
    );

    expect(html).toContain('Detected (9)');
    expect(html).toContain('Missing (5)');
    expect(html).toContain('Leaking (0)');
  });

  it.each([
    {
      label: 'evaluated',
      header: {
        name: 'strict-transport-security',
        value: 'max-age=31536000',
        present: true,
        weight: 18,
        leaking: false,
        status: 'pass' as const,
      },
    },
    {
      label: 'not evaluated',
      header: {
        name: 'x-custom-header',
        value: 'enabled',
        present: true,
        weight: 0,
        leaking: false,
        status: 'unknown' as const,
      },
    },
  ])('renders the $label header name with bold, high-contrast styling', ({ header }) => {
    const html = renderToStaticMarkup(
      <HeaderCard header={header} type={HeaderTabType.DETECTED} />
    );

    expect(html).toMatch(
      /data-slot="card-title"[^>]*class="[^"]*font-bold[^"]*text-slate-950/
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```bash
npm test -- src/components/report/HeaderAnalysisVisualEmphasis.test.tsx
```

Expected: TypeScript reports that `counts` is not part of `HeaderTabsProps`, and the title-style assertions cannot pass because the current titles use `font-semibold` without `text-slate-950`.

- [ ] **Step 3: Add the typed tab counts and render them**

Extend `HeaderTabsProps` in `src/types/reportTypes.ts`:

```ts
export interface HeaderTabsProps {
  activeTab: HeaderTabType;
  onTabChange: (tab: HeaderTabType) => void;
  counts: Record<HeaderTabType, number>;
}
```

Derive and pass the counts in `HeadersSection`:

```tsx
<HeaderTabs
  activeTab={activeTab}
  onTabChange={handleTabChange}
  counts={{
    [HeaderTabType.DETECTED]: headers.detected.length,
    [HeaderTabType.MISSING]: headers.missing.length,
    [HeaderTabType.LEAKING]: headers.leaking.length,
  }}
/>
```

Accept `counts` in `HeaderTabs` and change its three labels:

```tsx
export const HeaderTabs: React.FC<HeaderTabsProps> = ({ activeTab, onTabChange, counts }) => {
```

```tsx
{`Detected (${counts[HeaderTabType.DETECTED]})`}
{`Missing (${counts[HeaderTabType.MISSING]})`}
{`Leaking (${counts[HeaderTabType.LEAKING]})`}
```

- [ ] **Step 4: Strengthen both header-card title variants**

Change both `CardTitle` instances in `HeaderCard.tsx`, retaining their current sizes:

```tsx
<CardTitle className="text-lg font-bold tracking-tight text-slate-950">{friendlyName}</CardTitle>
```

```tsx
<CardTitle className="text-xl font-bold tracking-tight text-slate-950">{friendlyName}</CardTitle>
```

- [ ] **Step 5: Run the focused test and verify the green state**

Run:

```bash
npm test -- src/components/report/HeaderAnalysisVisualEmphasis.test.tsx
```

Expected: all three tests pass.

- [ ] **Step 6: Run repository verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands exit successfully with no errors.

- [ ] **Step 7: Commit the implementation**

```bash
git add src/components/report/HeaderAnalysisVisualEmphasis.test.tsx src/types/reportTypes.ts src/components/report/HeadersSection.tsx src/components/report/HeaderTabs.tsx src/components/report/HeaderCard.tsx
git commit -m "feat: emphasize header analysis labels"
```
