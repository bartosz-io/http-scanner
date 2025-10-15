import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const strictTransportSecurityParser: HeaderParser = {
  headerName: 'strict-transport-security',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['HSTS header missing; max-age and includeSubDomains checks pending implementation.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: HSTS policy not yet validated; granting full credit temporarily.',
      ],
    };
  },
};
