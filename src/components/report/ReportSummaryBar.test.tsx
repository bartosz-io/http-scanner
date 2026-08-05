// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportSummaryBar } from './ReportSummaryBar';

afterEach(() => {
  cleanup();
});

describe('ReportSummaryBar', () => {
  it('keeps report identity and view controls in one summary region', () => {
    render(
      <ReportSummaryBar
        url="https://gdanskiewakacje.pl"
        createdAt={1785861751}
        value="security-analysis"
        onChange={vi.fn()}
      />
    );

    const summary = screen.getByRole('region', { name: 'Report summary' });

    expect(within(summary).getByRole('heading', {
      name: 'Security Scan Report',
    })).not.toBeNull();
    expect(within(summary).getByText('https://gdanskiewakacje.pl')).not.toBeNull();
    expect(within(summary).getByText(/Scanned/)).not.toBeNull();
    expect(within(summary).getByRole('group', { name: 'Report view' })).not.toBeNull();
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

    await userEvent.setup().click(
      screen.getByRole('button', { name: 'All response headers' })
    );

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('all-headers');
  });
});
