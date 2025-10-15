import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const xContentTypeOptionsParser: HeaderParser = {
  headerName: 'x-content-type-options',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['X-Content-Type-Options header missing; expect "nosniff" for success.'],
      };
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'nosniff') {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: [
          'nosniff prevents MIME-sniffing attacks on stylesheets and scripts.',
        ],
      };
    }

    if (normalized === '0' || normalized === 'off') {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: [
          `❌ X-Content-Type-Options is explicitly disabled (${value}); browsers may sniff dangerous MIME types.`,
        ],
      };
    }

    return {
      scoreDelta: context.weight * 0.3,
      status: 'partial',
      notes: [
        `⚠️ Unexpected directive "${value}". Use nosniff to ensure consistent MIME enforcement.`,
      ],
    };
  },
};
