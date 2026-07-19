import { describe, expect, it } from 'vitest';
import { isValidReportHash } from './reportHash';

describe('isValidReportHash', () => {
  it.each([
    '9249232fefb9a1c0455ba007d7784f6c',
    '9249232FEFB9A1C0455BA007D7784F6C',
  ])('accepts 32-character hexadecimal hash %s', (hash) => {
    expect(isValidReportHash(hash)).toBe(true);
  });

  it.each([
    undefined,
    null,
    123,
    '',
    '0123456789abcdef',
    '9249232fefb9a1c0455ba007d7784f6g',
    '9249232fefb9a1c0455ba007d7784f6c0',
  ])('rejects invalid hash %s', (hash) => {
    expect(isValidReportHash(hash)).toBe(false);
  });
});
