import { describe, expect, it } from 'vitest';
import type { CaptureResult } from 'posthog-js';
import {
  sanitizeAnalyticsValue,
  sanitizePostHogCapture,
} from './analyticsPrivacy';

const DELETE_TOKEN = '0123456789abcdef0123456789abcdef';

describe('sanitizeAnalyticsValue', () => {
  it('removes token properties recursively and keeps safe values', () => {
    expect(
      sanitizeAnalyticsValue({
        hash: '9249232fefb9a1c0455ba007d7784f6c',
        deleteToken: DELETE_TOKEN,
        nested: {
          access_token: DELETE_TOKEN,
          score: 92,
        },
        items: [{ TOKEN: DELETE_TOKEN }, { header: 'content-security-policy' }],
      })
    ).toEqual({
      hash: '9249232fefb9a1c0455ba007d7784f6c',
      nested: {
        score: 92,
      },
      items: [{}, { header: 'content-security-policy' }],
    });
  });

  it('strips token query parameters from absolute and relative URLs', () => {
    expect(
      sanitizeAnalyticsValue({
        $current_url:
          `https://httpscanner.com/report/hash?source=scan&token=${DELETE_TOKEN}#headers`,
        path: `/report/hash?deleteToken=${DELETE_TOKEN}&source=scan`,
      })
    ).toEqual({
      $current_url: 'https://httpscanner.com/report/hash?source=scan#headers',
      path: '/report/hash?source=scan',
    });
  });

  it('does not rewrite ordinary strings or safe URL parameters', () => {
    expect(
      sanitizeAnalyticsValue({
        message: 'token based authentication is supported',
        url: 'https://example.com/path?source=scan',
      })
    ).toEqual({
      message: 'token based authentication is supported',
      url: 'https://example.com/path?source=scan',
    });
  });
});

describe('sanitizePostHogCapture', () => {
  it('preserves the event while removing secrets from every property group', () => {
    const event: CaptureResult = {
      uuid: 'event-uuid',
      event: 'report viewed',
      properties: {
        token: 'public-project-token',
        $current_url:
          `https://httpscanner.com/report/hash?token=${DELETE_TOKEN}`,
        hash: 'hash',
        context: {
          deleteToken: DELETE_TOKEN,
        },
      },
      $set: {
        deleteToken: DELETE_TOKEN,
        plan: 'free',
      },
    };

    expect(sanitizePostHogCapture(event)).toEqual({
      uuid: 'event-uuid',
      event: 'report viewed',
      properties: {
        token: 'public-project-token',
        $current_url: 'https://httpscanner.com/report/hash',
        hash: 'hash',
        context: {},
      },
      $set: {
        plan: 'free',
      },
    });
  });

  it('preserves a dropped event', () => {
    expect(sanitizePostHogCapture(null)).toBeNull();
  });

  it.each([
    'lead form viewed',
    'lead submitted',
    'lead submission failed',
  ])('removes PostHog-enriched report location data from %s', (eventName) => {
    const event: CaptureResult = {
      uuid: 'lead-event-uuid',
      event: eventName,
      properties: {
        token: 'public-project-token',
        distinct_id: 'anonymous-user-id',
        $lib: 'web',
        $lib_version: '1.2.3',
        $current_url:
          'https://httpscanner.com/report/9249232fefb9a1c0455ba007d7784f6c',
        $pathname: '/report/9249232fefb9a1c0455ba007d7784f6c',
        $session_entry_url:
          'https://httpscanner.com/report/9249232fefb9a1c0455ba007d7784f6c',
        landing_page:
          'https://httpscanner.com/report/9249232fefb9a1c0455ba007d7784f6c',
        landing_path: '/report/9249232fefb9a1c0455ba007d7784f6c',
        hash: '9249232fefb9a1c0455ba007d7784f6c',
        score: 47.5,
      },
    };

    expect(sanitizePostHogCapture(event)).toEqual({
      uuid: 'lead-event-uuid',
      event: eventName,
      properties: {
        token: 'public-project-token',
        distinct_id: 'anonymous-user-id',
        $lib: 'web',
        $lib_version: '1.2.3',
        hash: '9249232fefb9a1c0455ba007d7784f6c',
        score: 47.5,
      },
    });
  });
});
