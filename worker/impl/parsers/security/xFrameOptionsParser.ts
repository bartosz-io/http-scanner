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

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: value not validated yet; providing full credit as placeholder.',
      ],
    };
  },
};
