import { describe, expect, it } from 'vitest';
import {
  createReportViewUrl,
  getScannerMode,
  parseReportView,
} from './reportView';

describe('parseReportView', () => {
  it('returns the all-headers view when requested', () => {
    expect(parseReportView('?view=all-headers')).toBe('all-headers');
  });

  it.each(['', '?view=unknown'])('defaults invalid view %s to security analysis', (search) => {
    expect(parseReportView(search)).toBe('security-analysis');
  });
});

describe('getScannerMode', () => {
  it('maps each report view to its scanner mode', () => {
    expect(getScannerMode('security-analysis')).toBe('security-headers');
    expect(getScannerMode('all-headers')).toBe('all-headers');
  });
});

describe('createReportViewUrl', () => {
  it('adds the all-headers view after existing safe parameters', () => {
    expect(createReportViewUrl('/report/hash', '?source=scan', 'all-headers')).toBe(
      '/report/hash?source=scan&view=all-headers'
    );
  });

  it('removes the default view while preserving unrelated parameters', () => {
    expect(
      createReportViewUrl('/report/hash', '?view=all-headers&source=scan', 'security-analysis')
    ).toBe('/report/hash?source=scan');
  });
});
