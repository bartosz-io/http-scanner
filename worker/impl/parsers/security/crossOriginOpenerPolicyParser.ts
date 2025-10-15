import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const crossOriginOpenerPolicyParser: HeaderParser = {
  headerName: 'cross-origin-opener-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Cross-Origin-Opener-Policy header missing; document cannot guarantee cross-origin isolation.'],
      };
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'same-origin') {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: [
          'same-origin provides full cross-origin isolation for popup windows.',
        ],
      };
    }

    if (normalized === 'same-origin-allow-popups') {
      return {
        scoreDelta: context.weight * 0.6,
        status: 'partial',
        notes: [
          '⚠️ same-origin-allow-popups permits popups to reattach to the opener; use same-origin for stronger isolation.',
        ],
      };
    }

    if (normalized === 'unsafe-none') {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: [
          '❌ unsafe-none disables cross-origin opener protection, enabling speculative side-channel attacks.',
        ],
      };
    }

    return {
      scoreDelta: context.weight * 0.4,
      status: 'partial',
      notes: [
        `⚠️ Unrecognized COOP value "${value}". Prefer same-origin for robust isolation.`,
      ],
    };
  },
};
