import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

const normalizePolicyList = (value: string): string[] =>
  value
    .split(',')
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean);

const classifyPolicy = (policy: string) => {
  const strictPolicies = new Set([
    'no-referrer',
    'strict-origin-when-cross-origin',
    'same-origin',
    'strict-origin',
  ]);
  const moderatePolicies = new Set([
    'origin-when-cross-origin',
    'origin',
    'no-referrer-when-downgrade',
  ]);

  if (strictPolicies.has(policy)) {
    return 'strict' as const;
  }
  if (moderatePolicies.has(policy)) {
    return 'moderate' as const;
  }
  if (policy === 'unsafe-url') {
    return 'unsafe' as const;
  }
  return 'unknown' as const;
};

export const referrerPolicyParser: HeaderParser = {
  headerName: 'referrer-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Referrer-Policy header missing; browsers default to no-referrer-when-downgrade.'],
      };
    }

    const policies = normalizePolicyList(value);
    if (policies.length === 0) {
      return {
        scoreDelta: 0,
        status: 'fail',
        notes: ['Referrer-Policy header present but no valid token detected.'],
      };
    }

    const effectivePolicy = policies[0];
    const classification = classifyPolicy(effectivePolicy);
    const notes: string[] = [`Effective policy: ${effectivePolicy}`];

    if (policies.length > 1) {
      notes.push('Multiple policies detected; browsers use the first token.');
    }

    switch (classification) {
      case 'strict':
        notes.push('Policy meets modern privacy expectations.');
        return {
          scoreDelta: context.weight,
          status: 'pass',
          notes,
        };
      case 'moderate':
        notes.push('Policy is better than default but still reveals extra origin data.');
        return {
          scoreDelta: context.weight * 0.6,
          status: 'partial',
          notes,
        };
      case 'unsafe':
        notes.push('unsafe-url leaks the full referrer including query strings.');
        return {
          scoreDelta: 0,
          status: 'fail',
          notes,
        };
      default:
        notes.push('Unrecognized policy; treat as partial credit pending manual review.');
        return {
          scoreDelta: context.weight * 0.4,
          status: 'partial',
          notes,
        };
    }
  },
};
