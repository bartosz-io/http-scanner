const SCANNER_TRANSPORT_HEADERS = new Set([
  'cf-ray',
  'cf-cache-status',
  'cf-mitigated',
  'cf-worker',
  'cf-edge-cache',
  'cf-connecting-ip',
  'cf-bgj',
  'cf-visitor',
  'cf-apo-via',
  'alt-svc',
]);

export function extractResponseHeaders(headers: Headers): Record<string, string> {
  const extracted: Record<string, string> = {};
  headers.forEach((value, name) => {
    extracted[name.toLowerCase()] = value;
  });

  const setCookieValues = headers.getSetCookie();
  if (setCookieValues.length > 0) {
    extracted['set-cookie'] = setCookieValues.join('\n');
  }

  return extracted;
}

export function filterScannerTransportHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([name, value]) => {
      const normalizedName = name.toLowerCase();
      if (SCANNER_TRANSPORT_HEADERS.has(normalizedName)) return false;
      return !(
        normalizedName === 'server' &&
        value.toLowerCase().includes('cloudflare')
      );
    })
  );
}
