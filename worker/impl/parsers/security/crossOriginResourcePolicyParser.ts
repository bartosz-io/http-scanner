import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const crossOriginResourcePolicyParser: HeaderParser = {
  headerName: 'cross-origin-resource-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Cross-Origin-Resource-Policy header missing; browsers may share resources with any origin.'],
      };
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'same-origin') {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: [
          'same-origin ensures responses are only shared with the origin that served them.',
        ],
      };
    }

    if (normalized === 'same-site') {
      return {
        scoreDelta: context.weight * 0.7,
        status: 'partial',
        notes: [
          '⚠️ same-site allows subdomains to consume responses. Prefer same-origin for stricter isolation.',
        ],
      };
    }

    if (normalized === 'cross-origin') {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: [
          '❌ cross-origin shares responses with any origin, negating CORP protections.',
        ],
      };
    }

    return {
      scoreDelta: context.weight * 0.4,
      status: 'partial',
      notes: [
        `⚠️ Unrecognized CORP value "${value}". Use same-origin to prevent cross-origin data leaks.`,
      ],
    };
  },
};
