import { describe, expect, it } from 'vitest';
import { initializePostHog } from './posthogClient';

describe('initializePostHog', () => {
  it('does not initialize a browser client during prerendering', () => {
    expect(initializePostHog()).toBeNull();
  });
});
