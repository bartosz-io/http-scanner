import { readFileSync, readdirSync } from 'node:fs';
import { extname } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOT = new URL('../', import.meta.url);
const PROJECT_ROOT = new URL('../../', import.meta.url);

function readSourceTree(directory: URL): string {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.name !== 'assets')
    .map((entry) => {
      const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);

      if (entry.isDirectory()) {
        return readSourceTree(entryUrl);
      }

      return !entry.name.includes('.test.') &&
        ['.ts', '.tsx', '.astro'].includes(extname(entry.name))
        ? readFileSync(entryUrl, 'utf8')
        : '';
    })
    .join('\n');
}

describe('M5 analytics source contract', () => {
  it('has no React PostHog provider or hook usage left in src', () => {
    const source = readSourceTree(SOURCE_ROOT);

    expect(source.includes('PostHogProvider')).toBe(false);
    expect(source.includes('usePostHog')).toBe(false);
    expect(source.includes("capturePostHogEvent('$pageview'")).toBe(false);
    expect(source.includes(".capture('$pageview'")).toBe(false);
  });

  it('masks every delete-token UI surface from autocapture', () => {
    const files = [
      'src/components/report/DeleteConfirmationModal.tsx',
      'src/components/report/ReportHeader.tsx',
      'src/components/report/TokenWarningAlert.tsx',
    ];

    for (const file of files) {
      const source = readFileSync(new URL(file, PROJECT_ROOT), 'utf8');
      expect(source, file).toContain('ph-no-capture');
      expect(source, file).toContain('ph-mask');
    }
  });

  it('preserves every explicit application event name', () => {
    const files = [
      'src/hooks/useScanForm.ts',
      'src/hooks/useReportDelete.ts',
      'src/components/report/ReportView.tsx',
      'src/components/report/DeleteSection.tsx',
      'src/components/report/SharingSection.tsx',
      'worker/impl/controllers/ScanController.ts',
      'worker/impl/controllers/DeleteReportController.ts',
    ];
    const source = files
      .map((file) => readFileSync(new URL(file, PROJECT_ROOT), 'utf8'))
      .join('\n');

    for (const eventName of [
      'scan submitted',
      'scan failed',
      'url scanned',
      'report viewed',
      'report shared',
      'delete report initiated',
      'delete report failed',
      'scan rate limited',
      'report deleted',
    ]) {
      expect(source.includes(`'${eventName}'`), eventName).toBe(true);
    }
  });
});
