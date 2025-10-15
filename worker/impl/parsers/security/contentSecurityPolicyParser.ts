import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

const normalizeToken = (token: string): string =>
  token.trim().replace(/^'|'$/g, '').toLowerCase();

const extractDirectives = (value: string): Map<string, string[]> => {
  const directives = value.split(';').map(part => part.trim()).filter(Boolean);
  const map = new Map<string, string[]>();

  for (const directive of directives) {
    const [name, ...rest] = directive.split(/\s+/);
    if (!name) {
      continue;
    }
    const normalizedName = name.toLowerCase();
    const tokens = rest.map(normalizeToken).filter(Boolean);
    map.set(normalizedName, tokens);
  }

  return map;
};

const includesWildcard = (tokens: string[]): boolean => tokens.some(token => token === '*');

const includesInsecureScheme = (tokens: string[]): boolean => tokens.includes('http:');

const includesBroadHttps = (tokens: string[]): boolean => tokens.includes('https:');

const includesUnsafeInline = (tokens: string[]): boolean => tokens.includes('unsafe-inline');

const includesUnsafeEval = (tokens: string[]): boolean => tokens.includes('unsafe-eval');

const includesDataOrBlob = (tokens: string[]): boolean =>
  tokens.some(token => token === 'data:' || token === 'blob:');

const hasNonceOrHash = (tokens: string[]): boolean =>
  tokens.some(
    token =>
      token.startsWith('nonce-') ||
      token.startsWith('sha256-') ||
      token.startsWith('sha384-') ||
      token.startsWith('sha512-'),
  );

const toNotes = (
  headerValue: string,
  failReasons: string[],
  warnReasons: string[],
  infoNotes: string[],
): string[] => {
  const notes = [`Observed CSP: ${headerValue}`];
  if (failReasons.length > 0) {
    notes.push(...failReasons.map(reason => `❌ ${reason}`));
  }
  if (warnReasons.length > 0) {
    notes.push(...warnReasons.map(reason => `⚠️ ${reason}`));
  }
  if (infoNotes.length > 0) {
    notes.push(...infoNotes.map(reason => `ℹ️ ${reason}`));
  }
  if (failReasons.length === 0 && warnReasons.length === 0) {
    notes.push('✅ CSP directives enforce strict defaults without obvious bypasses.');
  }
  return notes;
};

export const contentSecurityPolicyParser: HeaderParser = {
  headerName: 'content-security-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['CSP header missing; browsers fall back to permissive defaults.'],
      };
    }

    const directives = extractDirectives(value);
    const failReasons: string[] = [];
    const warnReasons: string[] = [];
    const infoNotes: string[] = [];

    const defaultSrc = directives.get('default-src');
    const scriptSrc = directives.get('script-src') ?? defaultSrc;
    const objectSrc = directives.get('object-src');
    const baseUri = directives.get('base-uri');
    const frameAncestors = directives.get('frame-ancestors');

    if (!defaultSrc || defaultSrc.length === 0) {
      failReasons.push('Missing default-src directive; fallback allows all origins.');
    } else {
      if (includesWildcard(defaultSrc)) {
        failReasons.push('default-src allows wildcards or schemes (e.g., * or http:).');
      }
      if (includesInsecureScheme(defaultSrc)) {
        failReasons.push('default-src permits http: resources, enabling downgrade attacks.');
      }
      if (includesBroadHttps(defaultSrc)) {
        warnReasons.push('default-src allows any https: origin; consider narrowing to explicit hosts.');
      }
      if (includesDataOrBlob(defaultSrc)) {
        warnReasons.push('default-src allows data: or blob:, which weakens isolation.');
      }
    }

    if (!scriptSrc) {
      warnReasons.push('script-src not defined; scripts inherit default-src which may be too broad.');
    } else {
      const unsafeInline = includesUnsafeInline(scriptSrc);
      const unsafeEval = includesUnsafeEval(scriptSrc);
      if (unsafeInline && !hasNonceOrHash(scriptSrc) && !scriptSrc.includes('strict-dynamic')) {
        failReasons.push('script-src allows unsafe-inline without nonce/hash/strict-dynamic.');
      } else if (unsafeInline) {
        warnReasons.push('script-src relies on unsafe-inline but mitigated by nonces/hashes.');
      }
      if (unsafeEval) {
        warnReasons.push('script-src allows unsafe-eval; prefer removing legacy eval usage.');
      }
      if (includesWildcard(scriptSrc)) {
        failReasons.push('script-src allows wildcards or unrestricted schemes.');
      }
      if (includesInsecureScheme(scriptSrc)) {
        failReasons.push('script-src permits http: scripts, exposing downgrade/XSS risks.');
      }
      if (includesBroadHttps(scriptSrc)) {
        warnReasons.push('script-src allows any https: host; explicitly pin trusted origins.');
      }
      if (includesDataOrBlob(scriptSrc)) {
        warnReasons.push('script-src allows data: or blob:, increasing XSS exposure.');
      }
    }

    if (!objectSrc || objectSrc.length === 0) {
      warnReasons.push('object-src not set; recommend setting to none.');
    } else if (!(objectSrc.length === 1 && objectSrc[0] === 'none')) {
      warnReasons.push('object-src should be explicitly set to none to block plug-in content.');
    }

    if (!baseUri) {
      warnReasons.push('base-uri not declared; attackers could inject <base> tags.');
    } else if (!(baseUri.length === 1 && (baseUri[0] === 'self' || baseUri[0] === 'none'))) {
      warnReasons.push('base-uri should be restricted to self or none.');
    }

    if (!frameAncestors) {
      warnReasons.push('frame-ancestors missing; clickjacking protections rely on this directive.');
    } else if (frameAncestors.includes('*') || frameAncestors.includes('http:')) {
      failReasons.push('frame-ancestors allows broad embedding (e.g., * or http:).');
    }

    if (!directives.has('upgrade-insecure-requests') && !directives.has('block-all-mixed-content')) {
      infoNotes.push('Consider upgrade-insecure-requests or block-all-mixed-content to prevent mixed content downgrades.');
    }

    if (directives.has('report-uri') || directives.has('report-to')) {
      infoNotes.push('CSP reporting detected; ensure the reporting endpoint is monitored.');
    }

    const severity = failReasons.length > 0 ? 'fail' : warnReasons.length > 0 ? 'partial' : 'pass';
    const scoreMultiplier = severity === 'pass' ? 1 : severity === 'partial' ? 0.6 : 0;

    return {
      scoreDelta: context.weight * scoreMultiplier,
      status: severity,
      notes: toNotes(value, failReasons, warnReasons, infoNotes),
    };
  },
};
