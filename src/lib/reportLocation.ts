import { isValidReportHash } from '../../shared/reportHash';

const DELETE_TOKEN_PATTERN = /^[0-9a-f]{32}$/i;
const REPORT_PATH_PATTERN = /^\/report\/([^/]+)\/?$/;

export function parseReportPathname(pathname: string): string | null {
  const match = REPORT_PATH_PATTERN.exec(pathname);
  const hash = match?.[1];
  return isValidReportHash(hash) ? hash : null;
}

export function parseDeleteToken(search: string): string | null {
  const token = new URLSearchParams(search).get('token');
  return token && DELETE_TOKEN_PATTERN.test(token) ? token : null;
}

export function createSanitizedReportUrl(
  pathname: string,
  search: string,
  fragment = ''
): string {
  const params = new URLSearchParams(search);
  params.delete('token');

  const query = params.toString();
  const normalizedFragment = fragment
    ? fragment.startsWith('#')
      ? fragment
      : `#${fragment}`
    : '';

  return `${pathname}${query ? `?${query}` : ''}${normalizedFragment}`;
}
