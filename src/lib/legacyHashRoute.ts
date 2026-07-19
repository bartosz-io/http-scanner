import { parseDeleteToken, parseReportPathname } from './reportLocation';

export function getLegacyHashRedirect(hashFragment: string): string | null {
  if (!hashFragment.startsWith('#/')) {
    return null;
  }

  const route = hashFragment.slice(1);
  const queryStart = route.indexOf('?');
  const pathname = queryStart === -1 ? route : route.slice(0, queryStart);
  const search = queryStart === -1 ? '' : route.slice(queryStart);

  if (pathname === '/') {
    return '/';
  }

  if (pathname === '/reports' || pathname === '/reports/') {
    return '/reports';
  }

  const reportHash = parseReportPathname(pathname);
  if (!reportHash) {
    return null;
  }

  const deleteToken = parseDeleteToken(search);
  return `/report/${reportHash}${deleteToken ? `?token=${deleteToken}` : ''}`;
}
