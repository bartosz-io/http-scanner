import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const xDnsPrefetchControlParser: HeaderParser = {
  headerName: 'x-dns-prefetch-control',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['X-DNS-Prefetch-Control header missing; caching of DNS prefetch not yet evaluated.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: directive value not yet checked; full credit applied temporarily.',
      ],
    };
  },
};
