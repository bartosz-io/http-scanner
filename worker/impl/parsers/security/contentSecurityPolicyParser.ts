import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const contentSecurityPolicyParser: HeaderParser = {
  headerName: 'content-security-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['CSP header not present; detailed parsing to be implemented.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: awarding provisional full credit until CSP policy evaluation is implemented.',
      ],
    };
  },
};
