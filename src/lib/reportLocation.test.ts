import { describe, expect, it } from 'vitest';
import {
  createReportPath,
  createSanitizedReportUrl,
  parseBrowserReportLocation,
  parseDeleteToken,
  parseReportPathname,
} from './reportLocation';

const REPORT_HASH = '9249232fefb9a1c0455ba007d7784f6c';
const DELETE_TOKEN = '0123456789abcdef0123456789abcdef';

describe('parseReportPathname', () => {
  it('returns the hash from a canonical report path', () => {
    expect(parseReportPathname(`/report/${REPORT_HASH}`)).toBe(REPORT_HASH);
  });

  it('accepts an optional trailing slash and uppercase hex', () => {
    const uppercaseHash = REPORT_HASH.toUpperCase();
    expect(parseReportPathname(`/report/${uppercaseHash}/`)).toBe(uppercaseHash);
  });

  it.each([
    '/report/not-a-hash',
    `/reports/${REPORT_HASH}`,
    `/report/${REPORT_HASH}/extra`,
    '/report/0123456789abcdef',
  ])('rejects invalid path %s', (pathname) => {
    expect(parseReportPathname(pathname)).toBeNull();
  });
});

describe('parseDeleteToken', () => {
  it('returns a valid delete token', () => {
    expect(parseDeleteToken(`?token=${DELETE_TOKEN}`)).toBe(DELETE_TOKEN);
  });

  it.each(['', '?token=invalid', '?token=0123456789abcdef'])(
    'rejects missing or invalid token in %s',
    (search) => {
      expect(parseDeleteToken(search)).toBeNull();
    }
  );
});

describe('createReportPath', () => {
  it('creates a normal report URL without a hash route', () => {
    expect(createReportPath(REPORT_HASH)).toBe(`/report/${REPORT_HASH}`);
  });

  it('adds a view before a validated delete token after a successful scan', () => {
    expect(createReportPath(REPORT_HASH, {
      deleteToken: DELETE_TOKEN,
      view: 'all-headers',
    })).toBe(`/report/${REPORT_HASH}?view=all-headers&token=${DELETE_TOKEN}`);
  });

  it('omits the default report view from generated URLs', () => {
    expect(createReportPath(REPORT_HASH, { view: 'security-analysis' })).toBe(
      `/report/${REPORT_HASH}`
    );
  });

  it('rejects malformed report data', () => {
    expect(() => createReportPath('invalid')).toThrow(/invalid hash/);
    expect(() => createReportPath(REPORT_HASH, { deleteToken: 'invalid' })).toThrow(
      /invalid delete token/
    );
  });
});

describe('createSanitizedReportUrl', () => {
  it('removes the delete token while preserving unrelated parameters', () => {
    expect(
      createSanitizedReportUrl(
        `/report/${REPORT_HASH}`,
        `?token=${DELETE_TOKEN}&view=all-headers&source=scan`
      )
    ).toBe(`/report/${REPORT_HASH}?view=all-headers&source=scan`);
  });

  it('preserves a fragment and normalizes its prefix', () => {
    expect(
      createSanitizedReportUrl(
        `/report/${REPORT_HASH}`,
        `?token=${DELETE_TOKEN}`,
        'headers'
      )
    ).toBe(`/report/${REPORT_HASH}#headers`);
  });
});

describe('parseBrowserReportLocation', () => {
  it('keeps a valid token in memory and removes it from the browser URL', () => {
    expect(
      parseBrowserReportLocation(
        `/report/${REPORT_HASH}`,
        `?token=${DELETE_TOKEN}&view=all-headers&source=scan`
      )
    ).toEqual({
      hash: REPORT_HASH,
      deleteToken: DELETE_TOKEN,
      sanitizedUrl: `/report/${REPORT_HASH}?view=all-headers&source=scan`,
      shouldSanitize: true,
      view: 'all-headers',
    });
  });

  it('removes an invalid token before analytics without retaining it', () => {
    expect(
      parseBrowserReportLocation(`/report/${REPORT_HASH}`, '?token=invalid')
    ).toEqual({
      hash: REPORT_HASH,
      deleteToken: null,
      sanitizedUrl: `/report/${REPORT_HASH}`,
      shouldSanitize: true,
      view: 'security-analysis',
    });
  });
});
