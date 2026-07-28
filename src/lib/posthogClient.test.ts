import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizePostHogCapture } from './analyticsPrivacy';
import { capturePostHogEvent, initializePostHog } from './posthogClient';

const { posthogMock } = vi.hoisted(() => ({
  posthogMock: {
    __loaded: false,
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

vi.mock('posthog-js', () => ({
  default: posthogMock,
}));

describe('initializePostHog', () => {
  beforeEach(() => {
    posthogMock.__loaded = false;
    posthogMock.init.mockClear();
    posthogMock.capture.mockClear();
    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
    vi.stubEnv('VITE_PUBLIC_POSTHOG_HOST', '');
    vi.stubEnv('PUBLIC_POSTHOG_PROJECT_TOKEN', '');
    vi.stubEnv('PUBLIC_POSTHOG_HOST', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('does not initialize a browser client during prerendering', () => {
    expect(initializePostHog()).toBeNull();
  });

  it('silently ignores events during prerendering', () => {
    expect(() => capturePostHogEvent('scan submitted', { url: 'https://example.com' }))
      .not.toThrow();
  });

  it('initializes once with one document pageview and privacy filtering', () => {
    vi.stubEnv('PUBLIC_POSTHOG_PROJECT_TOKEN', 'project-token');
    vi.stubEnv('PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');
    vi.stubGlobal('window', {
      location: new URL('https://httpscanner.com/'),
    });
    vi.stubGlobal('document', { referrer: '' });
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });

    initializePostHog();
    posthogMock.__loaded = true;
    initializePostHog();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.init).toHaveBeenCalledWith(
      'project-token',
      expect.objectContaining({
        api_host: 'https://eu.i.posthog.com',
        capture_pageview: true,
        before_send: sanitizePostHogCapture,
      })
    );
  });

  it('adds stable landing attribution without changing event properties', () => {
    vi.stubEnv('PUBLIC_POSTHOG_PROJECT_TOKEN', 'project-token');
    vi.stubGlobal('window', {
      location: new URL(
        'https://httpscanner.com/security-headers-checker?utm_source=google'
      ),
    });
    vi.stubGlobal('document', {
      referrer: 'https://www.google.com/search?q=security+headers',
    });
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });

    capturePostHogEvent('scan submitted', { url: 'https://example.com' });

    expect(posthogMock.capture).toHaveBeenCalledWith('scan submitted', {
      landing_page: 'https://httpscanner.com/security-headers-checker',
      landing_path: '/security-headers-checker',
      referrer: 'https://www.google.com/search',
      url: 'https://example.com',
    });
  });
});
