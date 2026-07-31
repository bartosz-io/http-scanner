import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AllHeaderCard } from './AllHeaderCard';

describe('AllHeaderCard', () => {
  it('contains a long unbroken value inside a horizontally scrollable panel', () => {
    const html = renderToStaticMarkup(
      <AllHeaderCard
        header={{
          name: 'report-to',
          displayName: 'Report-To',
          value: `https://example.com/${'a'.repeat(2048)}`,
          category: 'Other',
          summary: 'Reporting endpoint metadata.',
        }}
      />
    );

    expect(html).toMatch(
      /data-slot="card"[^>]*class="[^"]*min-w-0[^"]*max-w-full/
    );
    expect(html).toMatch(
      /data-slot="card-content"[^>]*class="[^"]*min-w-0[^"]*max-w-full/
    );
    expect(html).toMatch(
      /class="[^"]*w-full[^"]*max-w-full[^"]*overflow-x-auto/
    );
    expect(html).not.toContain('break-all">https://example.com/');
  });
});
