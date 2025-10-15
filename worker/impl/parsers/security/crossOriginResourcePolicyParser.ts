import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const crossOriginResourcePolicyParser: HeaderParser = {
  headerName: 'cross-origin-resource-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Cross-Origin-Resource-Policy header missing; directive checks coming soon.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: CORP directives not enforced yet; awarding full credit temporarily.',
      ],
    };
  },
};
