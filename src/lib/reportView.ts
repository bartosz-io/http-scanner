export type ScannerResultView = 'security-analysis' | 'all-headers';
export type ScannerMode = 'security-headers' | 'all-headers';

const DEFAULT_REPORT_VIEW: ScannerResultView = 'security-analysis';

export function parseReportView(search: string): ScannerResultView {
  return new URLSearchParams(search).get('view') === 'all-headers'
    ? 'all-headers'
    : DEFAULT_REPORT_VIEW;
}

export function getScannerMode(view: ScannerResultView): ScannerMode {
  return view === 'all-headers' ? 'all-headers' : 'security-headers';
}

export function createReportViewUrl(
  pathname: string,
  search: string,
  view: ScannerResultView
): string {
  const params = new URLSearchParams(search);
  params.delete('view');

  if (view === 'all-headers') {
    params.set('view', view);
  }

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}`;
}
