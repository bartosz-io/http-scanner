import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const crossOriginEmbedderPolicyParser: HeaderParser = {
  headerName: 'cross-origin-embedder-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Cross-Origin-Embedder-Policy header missing; isolation validation pending.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: COEP directives not yet parsed; provisional credit awarded.',
      ],
    };
  },
};
