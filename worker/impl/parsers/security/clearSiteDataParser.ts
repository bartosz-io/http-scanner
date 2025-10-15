import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const clearSiteDataParser: HeaderParser = {
  headerName: 'clear-site-data',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Clear-Site-Data header missing; future parser will detect overly broad wildcards.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: not yet distinguishing targeted versus wildcard directives; full credit granted.',
      ],
    };
  },
};
