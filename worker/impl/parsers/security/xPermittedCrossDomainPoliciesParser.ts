import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const xPermittedCrossDomainPoliciesParser: HeaderParser = {
  headerName: 'x-permitted-cross-domain-policies',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['X-Permitted-Cross-Domain-Policies header missing; expecting "none" ideally.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: policy value not yet inspected; full credit granted for now.',
      ],
    };
  },
};
