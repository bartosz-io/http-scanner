import posthog from 'posthog-js';
import { getAnalyticsAttribution } from './analyticsAttribution';
import { sanitizePostHogCapture } from './analyticsPrivacy';

type EventProperties = Record<string, unknown>;

export function initializePostHog(): typeof posthog | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const projectToken = import.meta.env.PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!projectToken) {
    return null;
  }

  if (!posthog.__loaded) {
    posthog.init(projectToken, {
      api_host: import.meta.env.PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30',
      capture_pageview: true,
      before_send: sanitizePostHogCapture,
      __add_tracing_headers: [window.location.host, 'localhost'],
    });
  }

  return posthog;
}

export function capturePostHogEvent(
  eventName: string,
  properties?: EventProperties
): void {
  const attribution = getAnalyticsAttribution();
  initializePostHog()?.capture(eventName, {
    ...(properties ?? {}),
    ...(attribution ?? {}),
  });
}
