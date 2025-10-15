import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const originAgentClusterParser: HeaderParser = {
  headerName: 'origin-agent-cluster',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Origin-Agent-Cluster header missing; enforcing isolation to be handled later.'],
      };
    }

    return {
      scoreDelta: context.weight,
      status: 'pass',
      notes: [
        'Stub parser: currently not checking for "?1" token; provisional credit applied.',
      ],
    };
  },
};
