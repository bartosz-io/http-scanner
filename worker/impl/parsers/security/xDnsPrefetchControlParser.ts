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

    const normalized = value.trim().toLowerCase();

    if (normalized === 'off' || normalized === '0') {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: ['DNS prefetching disabled to avoid leaking hostname metadata in advance.'],
      };
    }

    if (normalized === 'on' || normalized === '1') {
      return {
        scoreDelta: context.weight * 0.3,
        status: 'partial',
        notes: [
          '⚠️ DNS prefetching is enabled; disable it unless speculative lookups are required.',
        ],
      };
    }

    return {
      scoreDelta: context.weight * 0.4,
      status: 'partial',
      notes: [
        `⚠️ Unrecognized X-DNS-Prefetch-Control directive "${value}". Use off to prevent speculative lookups.`,
      ],
    };
  },
};
