import { describe, expect, it } from 'vitest';
import { capturePostHogEvent, initializePostHog } from './posthogClient';

describe('initializePostHog', () => {
  it('does not initialize a browser client during prerendering', () => {
    expect(initializePostHog()).toBeNull();
  });

  it('silently ignores events during prerendering', () => {
    expect(() => capturePostHogEvent('scan submitted', { url: 'https://example.com' }))
      .not.toThrow();
  });
});
