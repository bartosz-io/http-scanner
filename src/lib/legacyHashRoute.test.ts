import { describe, expect, it } from 'vitest';
import { getLegacyHashRedirect } from './legacyHashRoute';

const REPORT_HASH = '9249232fefb9a1c0455ba007d7784f6c';
const DELETE_TOKEN = '0123456789abcdef0123456789abcdef';

describe('getLegacyHashRedirect', () => {
  it.each([
    ['#/', '/'],
    ['#/reports', '/reports'],
    ['#/reports/', '/reports'],
    [`#/report/${REPORT_HASH}`, `/report/${REPORT_HASH}`],
    [
      `#/report/${REPORT_HASH}?token=${DELETE_TOKEN}`,
      `/report/${REPORT_HASH}?token=${DELETE_TOKEN}`,
    ],
  ])('maps %s to %s', (legacyHash, expected) => {
    expect(getLegacyHashRedirect(legacyHash)).toBe(expected);
  });

  it('drops an invalid delete token but preserves the report destination', () => {
    expect(
      getLegacyHashRedirect(`#/report/${REPORT_HASH}?token=not-a-token`)
    ).toBe(`/report/${REPORT_HASH}`);
  });

  it.each(['', '#about', '#/about', '#/report/not-a-hash'])(
    'does not redirect unsupported fragment %s',
    (legacyHash) => {
      expect(getLegacyHashRedirect(legacyHash)).toBeNull();
    }
  );
});
