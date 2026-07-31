import { isValidReportHash } from '@shared/reportHash';
import { parseReportView, type ScannerResultView } from './reportView';

const DELETE_TOKEN_PATTERN = /^[0-9a-f]{32}$/i;
const REPORT_PATH_PATTERN = /^\/report\/([^/]+)\/?$/;

export interface BrowserReportLocation {
  hash: string | null;
  deleteToken: string | null;
  view: ScannerResultView;
  sanitizedUrl: string;
  shouldSanitize: boolean;
}

export function parseReportPathname(pathname: string): string | null {
  const match = REPORT_PATH_PATTERN.exec(pathname);
  const hash = match?.[1];
  return isValidReportHash(hash) ? hash : null;
}

export function parseDeleteToken(search: string): string | null {
  const token = new URLSearchParams(search).get('token');
  return token && DELETE_TOKEN_PATTERN.test(token) ? token : null;
}

export function createReportPath(
  hash: string,
  options: { deleteToken?: string; view?: ScannerResultView } = {}
): string {
  if (!isValidReportHash(hash)) {
    throw new Error('Cannot create a report path from an invalid hash');
  }

  const pathname = `/report/${hash}`;
  if (options.deleteToken && !DELETE_TOKEN_PATTERN.test(options.deleteToken)) {
    throw new Error('Cannot create a report path from an invalid delete token');
  }

  const params = new URLSearchParams();
  if (options.view === 'all-headers') {
    params.set('view', options.view);
  }
  if (options.deleteToken) {
    params.set('token', options.deleteToken);
  }

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}`;
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

export function parseBrowserReportLocation(
  pathname: string,
  search: string,
  fragment = ''
): BrowserReportLocation {
  const params = new URLSearchParams(search);

  return {
    hash: parseReportPathname(pathname),
    deleteToken: parseDeleteToken(search),
    view: parseReportView(search),
    sanitizedUrl: createSanitizedReportUrl(pathname, search, fragment),
    shouldSanitize: params.has('token'),
  };
}
