import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = new URL('../../', import.meta.url);

function readSource(path: string): string {
  return readFileSync(new URL(path, PROJECT_ROOT), 'utf8');
}

describe('all response headers report presentation', () => {
  it('provides the accessible view switch and neutral browsing labels', () => {
    const source = [
      'src/components/report/ReportViewSwitch.tsx',
      'src/components/report/AllHeadersSection.tsx',
      'src/components/report/AllHeaderCard.tsx',
    ]
      .map(readSource)
      .join('\n');

    for (const label of [
      'All response headers',
      'Security analysis',
      'Search response headers',
      'All categories',
      'Other',
      'Known scanner-transport headers are excluded',
    ]) {
      expect(source, label).toContain(label);
    }

    expect(source).toContain('type="button"');
    expect(source).toContain('aria-pressed');
    expect(source).toContain('FormattedHeaderValue');
    expect(source).toContain('whitespace-pre-wrap');
  });

  it('keeps security-only and neutral report sections in distinct branches', () => {
    const source = readSource('src/components/report/ReportView.tsx');
    const securityBranch = source.match(
      /view === 'security-analysis'[\s\S]*?ScoreSection[\s\S]*?ReportActionSection[\s\S]*?HeadersSection/
    );
    const allHeadersBranch = source.match(
      /view === 'all-headers'[\s\S]*?AllHeadersSection/
    );

    expect(securityBranch).not.toBeNull();
    expect(allHeadersBranch).not.toBeNull();
    expect(source.match(/<ScoreSection/g)).toHaveLength(1);
    expect(source.match(/<ReportActionSection/g)).toHaveLength(1);
    expect(source.match(/<HeadersSection/g)).toHaveLength(1);
    expect(source.match(/<AllHeadersSection/g)).toHaveLength(1);
  });
});

describe('report view switching integration', () => {
  it('changes browser history and analytics without moving the report fetch', () => {
    const islandSource = readSource('src/components/islands/ReportIsland.tsx');
    const reportSource = readSource('src/components/report/ReportView.tsx');

    expect(islandSource).toContain('createReportViewUrl');
    expect(islandSource).toContain('window.history.pushState');
    expect(islandSource).toContain("addEventListener('popstate'");
    expect(islandSource).toContain("capturePostHogEvent('report view switched'");
    expect(islandSource).toContain('report_view: nextView');
    expect(islandSource).not.toContain('useReportData');

    expect(reportSource.match(/useReportData\(/g)).toHaveLength(1);
    expect(reportSource).toContain('report_view: initialReportView.current');
    expect(reportSource).toContain('selectAllResponseHeaders');
    expect(reportSource).toContain('linkGuides');
    expect(reportSource).toContain('linkGuides={true}');
    expect(readSource('src/components/report/AllHeaderCard.tsx')).toContain(
      "capturePostHogEvent('report to guide clicked'"
    );
  });

  it('keeps report viewed eligible only when the report initially loads', () => {
    const reportSource = readSource('src/components/report/ReportView.tsx');
    const reportViewedEffect = reportSource.match(
      /useEffect\(\(\) => \{[\s\S]*?capturePostHogEvent\('report viewed'[\s\S]*?\n\s*\}\n\s*\}, \[([^\]]*)\]\);/
    );

    expect(reportSource).toContain('React.useRef(view)');
    expect(reportViewedEffect).not.toBeNull();
    expect(reportViewedEffect?.[1].trim()).toBe('report');
  });
});
