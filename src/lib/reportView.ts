import { getHeaderCatalogEntry } from './headerCatalog';
import type { HeaderCategory } from './headerCatalog';
import type { HeaderEntry } from '../types';

export type ScannerResultView = 'security-analysis' | 'all-headers';
export type ScannerMode = 'security-headers' | 'all-headers';

export type ReportHeaderGroups = {
  detected: HeaderEntry[];
  missing: HeaderEntry[];
  leaking: HeaderEntry[];
};

export type AllResponseHeader = {
  name: string;
  displayName: string;
  value: string | undefined;
  category: HeaderCategory | 'Other';
  summary: string;
  guideSlug?: string;
};

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

export function selectAllResponseHeaders(groups: ReportHeaderGroups): AllResponseHeader[] {
  const headers = new Map<string, HeaderEntry>();

  for (const header of [...groups.detected, ...groups.leaking]) {
    const name = header.name.toLowerCase();
    if (header.present && !headers.has(name)) {
      headers.set(name, header);
    }
  }

  return [...headers.entries()]
    .map(([name, header]) => {
      const catalogEntry = getHeaderCatalogEntry(name);

      if (catalogEntry) {
        return {
          name,
          displayName: catalogEntry.displayName,
          value: header.value,
          category: catalogEntry.category,
          summary: catalogEntry.summary,
          guideSlug: catalogEntry.slug,
        };
      }

      return {
        name,
        displayName: name.replace(/(^|-)([a-z])/g, (_, separator, letter: string) => `${separator}${letter.toUpperCase()}`),
        value: header.value,
        category: 'Other' as const,
        summary: 'This response header is not yet covered by the HTTP Scanner reference.',
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name));
}
