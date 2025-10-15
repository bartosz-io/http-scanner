import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const referrerPolicyParser: HeaderParser = {
  headerName: 'referrer-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Referrer-Policy header missing; permissive policies will be penalized later.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: policy value not yet validated; awarding full credit until rules land.',
      ],
    };
  },
};
