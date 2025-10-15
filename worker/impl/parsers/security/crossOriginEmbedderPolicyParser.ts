import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const crossOriginEmbedderPolicyParser: HeaderParser = {
  headerName: 'cross-origin-embedder-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Cross-Origin-Embedder-Policy header missing; SharedArrayBuffer isolation not guaranteed.'],
      };
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'require-corp') {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: [
          'require-corp blocks cross-origin resources without CORP/COEP headers, enabling shared memory features.',
        ],
      };
    }

    if (normalized === 'credentialless') {
      return {
        scoreDelta: context.weight * 0.7,
        status: 'partial',
        notes: [
          '⚠️ credentialless allows cross-origin resources without credentials; verify this aligns with isolation goals.',
        ],
      };
    }

    if (normalized === 'unsafe-none') {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: [
          '❌ unsafe-none disables COEP protections; cross-origin resources may leak sensitive data.',
        ],
      };
    }

    return {
      scoreDelta: context.weight * 0.4,
      status: 'partial',
      notes: [
        `⚠️ Unrecognized COEP value "${value}". Prefer require-corp for robust cross-origin isolation.`,
      ],
    };
  },
};
