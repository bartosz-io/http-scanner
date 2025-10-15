import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

const parseTokens = (value: string): string[] =>
  value
    .split(',')
    .map(token => token.trim().replace(/^"|"$/g, '').toLowerCase())
    .filter(Boolean);

const allowedTokens = new Set(['cache', 'cookies', 'storage', 'executioncontexts']);

export const clearSiteDataParser: HeaderParser = {
  headerName: 'clear-site-data',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Clear-Site-Data header missing; user data may persist across sessions.'],
      };
    }

    const tokens = parseTokens(value);

    if (tokens.length === 0) {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: [
          '❌ Clear-Site-Data header present but no directives provided; browsers ignore empty lists.',
        ],
      };
    }

    const hasWildcard = tokens.includes('*');
    const unknown = tokens.filter(token => token !== '*' && !allowedTokens.has(token));
    const infoNotes: string[] = [];
    const warnReasons: string[] = [];

    if (hasWildcard) {
      warnReasons.push('Wildcard "*" clears all data; prefer targeted directives for minimal impact.');
    }

    if (unknown.length > 0) {
      warnReasons.push(`Unknown directives detected: ${unknown.join(', ')}.`);
    }

    if (!hasWildcard) {
      infoNotes.push(`Clearing scopes: ${tokens.join(', ')}.`);
    }

    const status = warnReasons.length > 0 ? 'partial' : 'pass';
    const multiplier = status === 'pass' ? 1 : 0.6;

    return {
      scoreDelta: context.weight * multiplier,
      status,
      notes: [
        `Observed Clear-Site-Data: ${value}`,
        ...warnReasons.map(reason => `⚠️ ${reason}`),
        ...infoNotes.map(reason => `ℹ️ ${reason}`),
      ],
    };
  },
};
