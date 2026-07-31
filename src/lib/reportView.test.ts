import { describe, expect, it } from 'vitest';
import {
  createReportViewUrl,
  getScannerMode,
  parseReportView,
  selectAllResponseHeaders,
} from './reportView';
import type { ReportHeaderGroups } from './reportView';

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
    expect(createReportViewUrl('/report/hash', '?source=scan', '', 'all-headers')).toBe(
      '/report/hash?source=scan&view=all-headers'
    );
  });

  it('removes the default view while preserving unrelated parameters', () => {
    expect(
      createReportViewUrl(
        '/report/hash',
        '?view=all-headers&source=scan',
        '',
        'security-analysis'
      )
    ).toBe('/report/hash?source=scan');
  });

  it('preserves the current fragment when switching views', () => {
    expect(
      createReportViewUrl(
        '/report/hash',
        '?source=scan',
        '#response-headers',
        'all-headers'
      )
    ).toBe('/report/hash?source=scan&view=all-headers#response-headers');
  });
});

describe('selectAllResponseHeaders', () => {
  it('projects present detected and leaking headers with neutral catalog metadata', () => {
    const groups: ReportHeaderGroups = {
      detected: [
        {
          name: 'Server',
          value: 'nginx',
          present: true,
          weight: 0,
          leaking: true,
        },
        {
          name: 'Cache-Control',
          value: 'public, max-age=60',
          present: true,
          weight: 0,
          leaking: false,
        },
        {
          name: 'X-Custom-Trace',
          value: 'trace-1',
          present: true,
          weight: 0,
          leaking: false,
        },
      ],
      missing: [
        {
          name: 'Strict-Transport-Security',
          present: false,
          weight: 0,
          leaking: false,
        },
      ],
      leaking: [
        {
          name: 'server',
          value: 'Apache',
          present: true,
          weight: 0,
          leaking: true,
        },
      ],
    };

    expect(selectAllResponseHeaders(groups)).toEqual([
      {
        name: 'cache-control',
        displayName: 'Cache-Control',
        value: 'public, max-age=60',
        category: 'Caching',
        summary: expect.any(String),
        guideSlug: 'cache-control',
      },
      {
        name: 'server',
        displayName: 'Server',
        value: 'nginx',
        category: 'Infrastructure and disclosure',
        summary: expect.any(String),
        guideSlug: 'server',
      },
      {
        name: 'x-custom-trace',
        displayName: 'X-Custom-Trace',
        value: 'trace-1',
        category: 'Other',
        summary: 'This response header is not yet covered by the HTTP Scanner reference.',
      },
    ]);
  });

  it('excludes absent headers and preserves multiline values', () => {
    const groups: ReportHeaderGroups = {
      detected: [
        {
          name: 'Set-Cookie',
          value: 'session=abc; Secure\nprefs=dark; SameSite=Lax',
          present: true,
          weight: 0,
          leaking: false,
        },
        {
          name: 'X-Omitted',
          value: 'not-present',
          present: false,
          weight: 0,
          leaking: false,
        },
      ],
      missing: [],
      leaking: [],
    };

    expect(selectAllResponseHeaders(groups)).toEqual([
      {
        name: 'set-cookie',
        displayName: 'Set-Cookie',
        value: 'session=abc; Secure\nprefs=dark; SameSite=Lax',
        category: 'Cookies and authentication',
        summary: expect.any(String),
        guideSlug: 'set-cookie',
      },
    ]);
  });

  it('projects inherited object keys as neutral Other headers', () => {
    const groups: ReportHeaderGroups = {
      detected: [
        {
          name: 'constructor',
          value: 'target-value',
          present: true,
          weight: 0,
          leaking: false,
        },
      ],
      missing: [],
      leaking: [],
    };

    expect(selectAllResponseHeaders(groups)).toEqual([
      {
        name: 'constructor',
        displayName: 'Constructor',
        value: 'target-value',
        category: 'Other',
        summary: 'This response header is not yet covered by the HTTP Scanner reference.',
      },
    ]);
  });
});
