export type AnalyticsAttribution = {
  landing_page: string;
  landing_path: string;
  referrer: string | null;
};

export type AnalyticsStorage = Pick<Storage, 'getItem' | 'setItem'>;

type AnalyticsLocation = Pick<Location, 'origin' | 'pathname'>;

type AnalyticsEnvironment = {
  location: AnalyticsLocation;
  referrer: string;
  storage?: AnalyticsStorage;
};

const ATTRIBUTION_STORAGE_KEY = 'httpscanner.analytics.attribution.v1';

export function sanitizeAttributionUrl(value: string): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function createAnalyticsAttribution(
  location: AnalyticsLocation,
  referrer: string
): AnalyticsAttribution {
  const landingPage =
    sanitizeAttributionUrl(`${location.origin}${location.pathname}`) ??
    `${location.origin}${location.pathname}`;

  return {
    landing_page: landingPage,
    landing_path: location.pathname,
    referrer: sanitizeAttributionUrl(referrer),
  };
}

function isAnalyticsAttribution(value: unknown): value is AnalyticsAttribution {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AnalyticsAttribution>;
  const sanitizedLandingPage =
    typeof candidate.landing_page === 'string'
      ? sanitizeAttributionUrl(candidate.landing_page)
      : null;
  const sanitizedReferrer =
    typeof candidate.referrer === 'string'
      ? sanitizeAttributionUrl(candidate.referrer)
      : candidate.referrer;

  return (
    sanitizedLandingPage === candidate.landing_page &&
    typeof candidate.landing_path === 'string' &&
    candidate.landing_path.startsWith('/') &&
    (candidate.referrer === null ||
      (typeof candidate.referrer === 'string' &&
        sanitizedReferrer === candidate.referrer))
  );
}

function resolveBrowserEnvironment(): AnalyticsEnvironment | null {
  if (typeof window === 'undefined') {
    return null;
  }

  let storage: AnalyticsStorage | undefined;
  try {
    storage = window.sessionStorage;
  } catch {
    storage = undefined;
  }

  return {
    location: window.location,
    referrer: typeof document === 'undefined' ? '' : document.referrer,
    storage,
  };
}

export function getAnalyticsAttribution(
  environment: AnalyticsEnvironment | null = resolveBrowserEnvironment()
): AnalyticsAttribution | null {
  if (!environment) {
    return null;
  }

  if (environment.storage) {
    try {
      const storedValue = environment.storage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (storedValue) {
        const parsedValue: unknown = JSON.parse(storedValue);
        if (isAnalyticsAttribution(parsedValue)) {
          return parsedValue;
        }
      }
    } catch {
      // Storage and malformed values must never block analytics capture.
    }
  }

  const attribution = createAnalyticsAttribution(
    environment.location,
    environment.referrer
  );

  if (environment.storage) {
    try {
      environment.storage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(attribution)
      );
    } catch {
      // Some browser privacy modes make sessionStorage unavailable.
    }
  }

  return attribution;
}
