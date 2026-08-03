import { describe, expect, it, vi } from 'vitest';
import { bindAnalyticsLinks, readTrackedLink } from './analyticsLinks';

describe('tracked static links', () => {
  it('accepts only the two bounded events and an optional header name', () => {
    expect(readTrackedLink('guide to checker clicked', 'Cache-Control')).toEqual({
      eventName: 'guide to checker clicked',
      properties: { header_name: 'Cache-Control' },
    });
    expect(readTrackedLink('checker to guide clicked')).toEqual({
      eventName: 'checker to guide clicked',
      properties: {},
    });
    expect(readTrackedLink('arbitrary event', 'Set-Cookie')).toBeNull();
    expect(readTrackedLink(undefined, 'Set-Cookie')).toBeNull();
  });

  it('delegates a nested click to the closest tracked anchor exactly once', () => {
    const capture = vi.fn();
    let clickListener: ((event: Event) => void) | undefined;
    const root = {
      addEventListener: vi.fn((_name: string, listener: EventListenerOrEventListenerObject) => {
        clickListener = listener as (event: Event) => void;
      }),
      removeEventListener: vi.fn(),
    } as unknown as ParentNode;
    const anchor = {
      dataset: {
        analyticsEvent: 'checker to guide clicked',
        analyticsHeaderName: 'Cache-Control',
        ignoredSecret: 'must-not-leak',
      },
    };
    const child = { closest: vi.fn(() => anchor) };

    const unbind = bindAnalyticsLinks(root, capture);
    clickListener?.({ target: child } as unknown as Event);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('checker to guide clicked', {
      header_name: 'Cache-Control',
    });

    unbind();
    expect(root.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
