import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const xFrameOptionsParser: HeaderParser = {
  headerName: 'x-frame-options',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['X-Frame-Options header missing; expect DENY or SAMEORIGIN.'],
      };
    }

    const normalized = value.trim().toUpperCase();

    if (normalized === 'DENY' || normalized === '"DENY"' || normalized === "'DENY'") {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: ['DENY prevents all framing, mitigating clickjacking.'],
      };
    }

    if (normalized === 'SAMEORIGIN' || normalized === '"SAMEORIGIN"' || normalized === "'SAMEORIGIN'") {
      return {
        scoreDelta: context.weight * 0.8,
        status: 'partial',
        notes: [
          '⚠️ SAMEORIGIN allows same-origin framing; add frame-ancestors to CSP for granular control.',
        ],
      };
    }

    if (normalized.startsWith('ALLOW-FROM')) {
      return {
        scoreDelta: context.weight * 0.4,
        status: 'partial',
        notes: [
          `⚠️ ${value} is deprecated and only honored by a subset of browsers. Transition to CSP frame-ancestors.`,
        ],
      };
    }

    return {
      scoreDelta: 0,
      status: 'fail',
      notes: [
        `❌ Unrecognized X-Frame-Options directive "${value}". Use DENY or SAMEORIGIN.`,
      ],
    };
  },
};
