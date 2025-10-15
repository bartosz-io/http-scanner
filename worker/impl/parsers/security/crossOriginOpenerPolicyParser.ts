import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const crossOriginOpenerPolicyParser: HeaderParser = {
  headerName: 'cross-origin-opener-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Cross-Origin-Opener-Policy header missing; isolation checks pending.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: not yet evaluating COOP directives; full credit granted for now.',
      ],
    };
  },
};
