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
