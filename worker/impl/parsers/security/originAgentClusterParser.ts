import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

export const originAgentClusterParser: HeaderParser = {
  headerName: 'origin-agent-cluster',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Origin-Agent-Cluster header missing; renderer processes may be shared across origins.'],
      };
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === '?1') {
      return {
        scoreDelta: context.weight,
        status: 'pass',
        notes: ['?1 opts the origin into agent isolation across tabs and popups.'],
      };
    }

    if (normalized === '?0') {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: ['❌ ?0 explicitly disables agent clustering; remove to restore isolation guarantees.'],
      };
    }

    return {
      scoreDelta: context.weight * 0.4,
      status: 'partial',
      notes: [
        `⚠️ Unexpected Origin-Agent-Cluster value "${value}". Use ?1 to sandbox the origin.`,
      ],
    };
  },
};
