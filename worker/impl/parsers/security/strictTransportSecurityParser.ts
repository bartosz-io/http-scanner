import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

const parseDirectives = (value: string) =>
  value
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => part.toLowerCase());

const parseMaxAge = (directives: string[]): number | null => {
  const maxAgeDirective = directives.find(d => d.startsWith('max-age'));
  if (!maxAgeDirective) {
    return null;
  }

  const match = maxAgeDirective.match(/max-age\s*=\s*("?)(\d+)\1/);
  if (!match) {
    return NaN;
  }

  return Number.parseInt(match[2], 10);
};

export const strictTransportSecurityParser: HeaderParser = {
  headerName: 'strict-transport-security',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Strict-Transport-Security header missing; HTTPS downgrade protection disabled.'],
      };
    }

    const directives = parseDirectives(value);
    const maxAge = parseMaxAge(directives);
    const includeSubDomains = directives.includes('includesubdomains');
    const preload = directives.includes('preload');
    const failReasons: string[] = [];
    const warnReasons: string[] = [];
    const infoNotes: string[] = [];

    if (maxAge === null) {
      failReasons.push('Missing max-age directive; browsers ignore the header without it.');
    } else if (Number.isNaN(maxAge)) {
      failReasons.push('Unable to parse max-age value; ensure it is an integer in seconds.');
    } else if (maxAge <= 0) {
      failReasons.push('max-age is set to zero or negative; this disables HSTS.');
    } else if (maxAge < 86400) {
      failReasons.push('max-age below 86400 seconds; HSTS expires too quickly to be effective.');
    } else if (maxAge < 15552000) {
      warnReasons.push('max-age below 6 months; consider increasing to at least 6 months.');
    } else if (maxAge < 31536000) {
      warnReasons.push('max-age below 1 year; browsers may drop HSTS between visits.');
    }

    if (!includeSubDomains) {
      warnReasons.push('includeSubDomains missing; sub-domains remain vulnerable to downgrade attacks.');
    }

    if (preload) {
      infoNotes.push('preload flag present; ensure domain is registered in the HSTS preload list.');
    }

    const status = failReasons.length > 0 ? 'fail' : warnReasons.length > 0 ? 'partial' : 'pass';
    const multiplier = status === 'pass' ? 1 : status === 'partial' ? 0.6 : 0;

    const notes = [
      `Observed HSTS: ${value}`,
      ...failReasons.map(reason => `❌ ${reason}`),
      ...warnReasons.map(reason => `⚠️ ${reason}`),
      ...infoNotes.map(reason => `ℹ️ ${reason}`),
    ];

    if (failReasons.length === 0 && warnReasons.length === 0) {
      notes.push('✅ Long-lived HSTS with includeSubDomains provides strong downgrade protection.');
    }

    return {
      scoreDelta: context.weight * multiplier,
      status,
      notes,
    };
  },
};
