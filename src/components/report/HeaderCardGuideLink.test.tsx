// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { capturePostHogEvent } from '@/lib/posthogClient';
import { HeaderTabType } from '@/types/reportTypes';
import { HeaderCard } from './HeaderCard';

vi.mock('@/lib/posthogClient', () => ({
  capturePostHogEvent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HeaderCard guide link', () => {
  it('keeps one internal guide link visible before and after expanding the finding', async () => {
    render(
      <HeaderCard
        header={{
          name: 'content-security-policy',
          present: false,
          weight: 20,
          leaking: false,
          status: 'missing',
        }}
        type={HeaderTabType.MISSING}
      />
    );

    const user = userEvent.setup();
    const guideLink = screen.getByRole('link', {
      name: 'Read complete Content-Security-Policy guide',
    });
    const toggle = screen.getByRole('button', { name: 'Show details' });
    const detailsId = toggle.getAttribute('aria-controls');
    const details = detailsId ? document.getElementById(detailsId) : null;

    expect(guideLink.getAttribute('href')).toBe('/headers/content-security-policy/');
    expect(guideLink.getAttribute('target')).toBeNull();
    expect(detailsId).toBeTruthy();
    expect(details).not.toBeNull();
    expect(details?.hidden).toBe(true);

    await user.click(toggle);

    expect(screen.getAllByRole('link', {
      name: 'Read complete Content-Security-Policy guide',
    })).toHaveLength(1);

    expect(details?.hidden).toBe(false);
    expect(document.activeElement).toBe(toggle);

    await user.tab();

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Copy' }));

    guideLink.addEventListener('click', event => event.preventDefault());
    fireEvent.click(guideLink);

    expect(capturePostHogEvent).toHaveBeenCalledOnce();
    expect(capturePostHogEvent).toHaveBeenCalledWith(
      'report finding to guide clicked',
      {
        header_name: 'Content-Security-Policy',
        finding_type: HeaderTabType.MISSING,
      }
    );
  });

  it('does not show a guide link when the header is absent from the catalog', async () => {
    render(
      <HeaderCard
        header={{
          name: 'x-private-finding',
          present: false,
          weight: 1,
          leaking: false,
          status: 'missing',
          notes: ['Custom finding.'],
        }}
        type={HeaderTabType.MISSING}
      />
    );

    expect(screen.queryByRole('link', { name: /Read complete .* guide/ })).toBeNull();

    await userEvent.setup().click(
      screen.getByRole('button', { name: 'Show details' })
    );

    expect(screen.queryByRole('link', { name: /Read complete .* guide/ })).toBeNull();
  });

  it('keeps external resources under Authoritative sources', async () => {
    render(
      <HeaderCard
        header={{
          name: 'content-security-policy',
          present: false,
          weight: 20,
          leaking: false,
          status: 'missing',
        }}
        type={HeaderTabType.MISSING}
      />
    );

    await userEvent.setup().click(
      screen.getByRole('button', { name: 'Show details' })
    );

    expect(screen.getByText('Authoritative sources')).not.toBeNull();
    expect(screen.getByRole('link', {
      name: 'MDN: Content-Security-Policy',
    }).getAttribute('target')).toBe('_blank');
  });
});
