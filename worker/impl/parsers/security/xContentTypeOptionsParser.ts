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

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: value not validated yet; full credit awarded temporarily.',
      ],
    };
  },
};
