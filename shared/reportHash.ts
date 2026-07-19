const REPORT_HASH_PATTERN = /^[0-9a-f]{32}$/i;

export function isValidReportHash(value: unknown): value is string {
  return typeof value === 'string' && REPORT_HASH_PATTERN.test(value);
}
