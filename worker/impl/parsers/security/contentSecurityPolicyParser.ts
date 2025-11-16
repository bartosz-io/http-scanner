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

const clamp = (value: number, min = 0, max = 1): number => Math.min(Math.max(value, min), max);

const createScoreTracker = () => {
  let earned = 0;
  let maximum = 0;

  const addComponent = (normalizedScore: number, weight: number) => {
    const componentScore = clamp(normalizedScore);
    earned += componentScore * weight;
    maximum += weight;
  };

  const finalize = (): number => {
    if (maximum === 0) {
      return 0;
    }
    return earned / maximum;
  };

  return { addComponent, finalize };
};

const toNotes = (
  failReasons: string[],
  warnReasons: string[],
  infoNotes: string[],
): string[] => {
  const notes = [];
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
    const tracker = createScoreTracker();

    const defaultSrc = directives.get('default-src');
    const scriptSrc = directives.get('script-src') ?? defaultSrc;
    const objectSrc = directives.get('object-src');
    const baseUri = directives.get('base-uri');
    const frameAncestors = directives.get('frame-ancestors');
    const hasReportDirective = directives.has('report-uri') || directives.has('report-to');

    if (!defaultSrc || defaultSrc.length === 0) {
      failReasons.push('Missing default-src directive; fallback allows all origins.');
      tracker.addComponent(0, 2);
    } else {
      let defaultScore = 0.25;
      const wildcard = includesWildcard(defaultSrc);
      const insecureScheme = includesInsecureScheme(defaultSrc);
      const broadHttps = includesBroadHttps(defaultSrc);
      const dataSources = includesDataOrBlob(defaultSrc);

      if (wildcard) {
        failReasons.push('default-src allows wildcards or schemes (e.g., * or http:).');
        defaultScore -= 0.15;
      } else {
        defaultScore += 0.2;
      }

      if (insecureScheme) {
        failReasons.push('default-src permits http: resources, enabling downgrade attacks.');
        defaultScore -= 0.25;
      } else {
        defaultScore += 0.2;
      }

      if (broadHttps) {
        warnReasons.push('default-src allows any https: origin; consider narrowing to explicit hosts.');
      }

      if (dataSources) {
        warnReasons.push('default-src allows data: or blob:, which weakens isolation.');
        defaultScore -= 0.05;
      } else {
        defaultScore += 0.1;
      }

      const isLockedDown =
        defaultSrc.length === 1 && (defaultSrc[0] === 'self' || defaultSrc[0] === 'none');
      const includesSelf = defaultSrc.includes('self');

      if (isLockedDown) {
        defaultScore += 0.25;
      } else if (includesSelf && !wildcard && !broadHttps) {
        defaultScore += 0.15;
      }

      tracker.addComponent(defaultScore, 2);
    }

    if (!scriptSrc) {
      warnReasons.push('script-src not defined; scripts inherit default-src which may be too broad.');
      tracker.addComponent(0.25, 3);
    } else {
      let scriptScore = 0.2;
      const unsafeInline = includesUnsafeInline(scriptSrc);
      const unsafeEval = includesUnsafeEval(scriptSrc);
      const wildcard = includesWildcard(scriptSrc);
      const insecureScheme = includesInsecureScheme(scriptSrc);
      const dataSources = includesDataOrBlob(scriptSrc);
      const strictDynamic = scriptSrc.includes('strict-dynamic');
      const nonceOrHash = hasNonceOrHash(scriptSrc);
      const hasMitigation = nonceOrHash || strictDynamic;

      if (unsafeInline && !hasMitigation) {
        failReasons.push('script-src allows unsafe-inline without nonce/hash/strict-dynamic.');
        scriptScore -= 0.25;
      } else if (unsafeInline) {
        warnReasons.push('script-src relies on unsafe-inline but mitigated by nonces/hashes.');
        scriptScore += 0.05;
      } else {
        scriptScore += 0.2;
      }

      if (unsafeEval) {
        warnReasons.push('script-src allows unsafe-eval; prefer removing legacy eval usage.');
      } else {
        scriptScore += 0.1;
      }

      if (wildcard) {
        failReasons.push('script-src allows wildcards or unrestricted schemes.');
        scriptScore -= 0.2;
      } else {
        scriptScore += 0.15;
      }

      if (insecureScheme) {
        failReasons.push('script-src permits http: scripts, exposing downgrade/XSS risks.');
        scriptScore -= 0.2;
      } else {
        scriptScore += 0.1;
      }

      if (includesBroadHttps(scriptSrc)) {
        warnReasons.push('script-src allows any https: host; explicitly pin trusted origins.');
      }

      if (dataSources) {
        warnReasons.push('script-src allows data: or blob:, increasing XSS exposure.');
      } else {
        scriptScore += 0.05;
      }

      if (!wildcard && !insecureScheme) {
        scriptScore += 0.1;
      }

      if (hasMitigation) {
        scriptScore += 0.2;
      }

      if (strictDynamic) {
        scriptScore += 0.05;
      }

      tracker.addComponent(scriptScore, 3);
    }

    if (!objectSrc || objectSrc.length === 0) {
      warnReasons.push('object-src not set; recommend setting to none.');
      tracker.addComponent(0.25, 0.8);
    } else if (!(objectSrc.length === 1 && objectSrc[0] === 'none')) {
      warnReasons.push('object-src should be explicitly set to none to block plug-in content.');
      tracker.addComponent(0.5, 0.8);
    } else {
      tracker.addComponent(1, 0.8);
    }

    if (!baseUri) {
      warnReasons.push('base-uri not declared; attackers could inject <base> tags.');
      tracker.addComponent(0, 0.8);
    } else if (!(baseUri.length === 1 && (baseUri[0] === 'self' || baseUri[0] === 'none'))) {
      warnReasons.push('base-uri should be restricted to self or none.');
      tracker.addComponent(0.4, 0.8);
    } else {
      tracker.addComponent(1, 0.8);
    }

    if (!frameAncestors) {
      warnReasons.push('frame-ancestors missing; clickjacking protections rely on this directive.');
      tracker.addComponent(0.3, 1);
    } else if (frameAncestors.includes('*') || frameAncestors.includes('http:')) {
      failReasons.push('frame-ancestors allows broad embedding (e.g., * or http:).');
      tracker.addComponent(0.1, 1);
    } else if (frameAncestors.includes('none')) {
      tracker.addComponent(1, 1);
    } else {
      tracker.addComponent(0.8, 1);
    }

    if (!directives.has('upgrade-insecure-requests') && !directives.has('block-all-mixed-content')) {
      infoNotes.push('Consider upgrade-insecure-requests or block-all-mixed-content to prevent mixed content downgrades.');
      tracker.addComponent(0, 0.5);
    } else if (directives.has('upgrade-insecure-requests')) {
      tracker.addComponent(1, 0.5);
    } else {
      tracker.addComponent(0.7, 0.5);
    }

    if (hasReportDirective) {
      infoNotes.push('CSP reporting detected; ensure the reporting endpoint is monitored.');
      tracker.addComponent(1, 0.3);
    } else {
      tracker.addComponent(0, 0.3);
    }

    const normalizedScore = tracker.finalize();
    const severity = failReasons.length > 0 ? 'fail' : warnReasons.length > 0 ? 'partial' : 'pass';

    return {
      scoreDelta: context.weight * normalizedScore,
      status: severity,
      notes: toNotes(failReasons, warnReasons, infoNotes),
    };
  },
};
