import type { CaptureResult } from 'posthog-js';

const SECRET_KEY_PATTERN = /token/i;

function sanitizeUrlString(value: string): string {
  const isRelativeUrl = value.startsWith('/') && !value.startsWith('//');
  if (!isRelativeUrl && !/^https?:\/\//i.test(value)) {
    return value;
  }

  try {
    const url = isRelativeUrl
      ? new URL(value, 'https://analytics.invalid')
      : new URL(value);
    let removedSecret = false;

    for (const key of Array.from(url.searchParams.keys())) {
      if (SECRET_KEY_PATTERN.test(key)) {
        url.searchParams.delete(key);
        removedSecret = true;
      }
    }

    if (!removedSecret) {
      return value;
    }

    return isRelativeUrl
      ? `${url.pathname}${url.search}${url.hash}`
      : url.toString();
  } catch {
    return value;
  }
}

export function sanitizeAnalyticsValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeUrlString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeAnalyticsValue);
  }

  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_KEY_PATTERN.test(key))
      .map(([key, nestedValue]) => [
        key,
        sanitizeAnalyticsValue(nestedValue),
      ])
  );
}

export function sanitizePostHogCapture(
  capture: CaptureResult | null
): CaptureResult | null {
  if (!capture) {
    return null;
  }

  const sanitizedCapture = sanitizeAnalyticsValue(capture) as CaptureResult;
  const transportToken = capture.properties.token;

  if (transportToken === undefined) {
    return sanitizedCapture;
  }

  return {
    ...sanitizedCapture,
    properties: {
      ...sanitizedCapture.properties,
      token: transportToken,
    },
  };
}
