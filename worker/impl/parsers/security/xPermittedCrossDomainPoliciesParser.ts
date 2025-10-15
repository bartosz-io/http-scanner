import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const xPermittedCrossDomainPoliciesParser: HeaderParser = {
  headerName: 'x-permitted-cross-domain-policies',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['X-Permitted-Cross-Domain-Policies header missing; expecting "none" ideally.'],
      };
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'none') {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: ['none blocks Flash/Adobe cross-domain policy files entirely.'],
      };
    }

    if (normalized === 'master-only') {
      return {
        scoreDelta: context.weight * 0.6,
        status: 'partial',
        notes: [
          '⚠️ master-only allows a single policy file; legacy Flash clients may still request data. Prefer none.',
        ],
      };
    }

    if (normalized === 'by-content-type' || normalized === 'by-ftp-filename') {
      return {
        scoreDelta: context.weight * 0.4,
        status: 'partial',
        notes: [
          `⚠️ ${value} restricts policies but still enables certain cross-domain requests. Use none to disable completely.`,
        ],
      };
    }

    if (normalized === 'all') {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: ['❌ all allows any cross-domain policy file, exposing old Flash attack surface.'],
      };
    }

    return {
      scoreDelta: context.weight * 0.4,
      status: 'partial',
      notes: [
        `⚠️ Unrecognized X-Permitted-Cross-Domain-Policies value "${value}". Use none to disable cross-domain policy files.`,
      ],
    };
  },
};
