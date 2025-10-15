import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const permissionsPolicyParser: HeaderParser = {
  headerName: 'permissions-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Permissions-Policy header missing; sandboxed feature directives pending analysis.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: not yet validating individual directives; provisional full credit granted.',
      ],
    };
  },
};
