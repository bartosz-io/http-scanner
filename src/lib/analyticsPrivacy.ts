import type { CaptureResult } from 'posthog-js';

const SECRET_KEY_PATTERN = /token/i;
const LEAD_EVENTS = new Set([
  'lead form viewed',
  'lead submitted',
  'lead submission failed',
]);
const LEAD_LOCATION_PROPERTIES = new Set([
  '$current_url',
  '$pathname',
  '$session_entry_url',
  'landing_page',
  'landing_path',
]);

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

  let sanitizedCapture = sanitizeAnalyticsValue(capture) as CaptureResult;
  if (LEAD_EVENTS.has(capture.event)) {
    sanitizedCapture = {
      ...sanitizedCapture,
      properties: Object.fromEntries(
        Object.entries(sanitizedCapture.properties).filter(
          ([key]) => !LEAD_LOCATION_PROPERTIES.has(key)
        )
      ),
    };
  }
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
