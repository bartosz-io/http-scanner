import posthog from 'posthog-js';

export function initializePostHog(): typeof posthog | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const projectToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!projectToken) {
    return null;
  }

  if (!posthog.__loaded) {
    posthog.init(projectToken, {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30',
      __add_tracing_headers: [window.location.host, 'localhost'],
    });
  }

  return posthog;
}
