import { HeaderParser } from '../../../interfaces/parsers/HeaderParser';

type FeatureOutcome = 'good' | 'warn' | 'fail';

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/)
    .map(token => token.replace(/^"|"$/g, '').replace(/^'|'$/g, '').toLowerCase())
    .filter(Boolean);

const parsePolicy = (value: string): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  const pattern = /([a-z0-9-]+)\s*=\s*\(([^)]*)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    const [, feature, rawList] = match;
    map.set(feature.toLowerCase(), tokenize(rawList.trim()));
  }

  return map;
};

const criticalFeatures: { name: string; description: string }[] = [
  { name: 'camera', description: 'Camera' },
  { name: 'microphone', description: 'Microphone' },
  { name: 'geolocation', description: 'Geolocation' },
  { name: 'usb', description: 'USB' },
  { name: 'serial', description: 'Serial ports' },
  { name: 'payment', description: 'Payment request API' },
  { name: 'interest-cohort', description: 'FLoC/Topics tracking' },
  { name: 'bluetooth', description: 'Web Bluetooth' },
];

const evaluateFeature = (tokens: string[] | undefined): FeatureOutcome => {
  if (!tokens) {
    return 'warn';
  }

  if (tokens.length === 0 || tokens.includes('none')) {
    return 'good';
  }

  if (tokens.includes('*')) {
    return 'fail';
  }

  if (tokens.includes('self')) {
    return 'warn';
  }

  return 'warn';
};

export const permissionsPolicyParser: HeaderParser = {
  headerName: 'permissions-policy',
  evaluate(value, context) {
    if (!value) {
      return {
        scoreDelta: 0,
        status: 'missing',
        notes: ['Permissions-Policy header missing; browsers use permissive defaults for powerful APIs.'],
      };
    }

    const directives = parsePolicy(value);
    const failReasons: string[] = [];
    const warnReasons: string[] = [];
    const infoNotes: string[] = [];

    criticalFeatures.forEach(feature => {
      const tokens = directives.get(feature.name);
      const outcome = evaluateFeature(tokens);

      if (outcome === 'good') {
        infoNotes.push(`${feature.description} access is explicitly disabled (${feature.name}=()).`);
      } else if (outcome === 'warn') {
        if (!tokens) {
          warnReasons.push(`${feature.description} missing; declare ${feature.name}=() to disable it.`);
        } else if (tokens.includes('self')) {
          warnReasons.push(`${feature.description} limited to self; consider ${feature.name}=() to fully disable.`);
        } else {
          warnReasons.push(`${feature.description} allows ${tokens.join(', ')}; verify these origins are required.`);
        }
      } else {
        failReasons.push(`${feature.description} allows all origins via ${feature.name}=*; disallow to prevent abuse.`);
      }
    });

    if (failReasons.length === 0 && warnReasons.length === 0) {
      infoNotes.push('All high-risk features are locked down; great isolation posture.');
    }

    const status = failReasons.length > 0 ? 'fail' : warnReasons.length > 0 ? 'partial' : 'pass';
    const multiplier = status === 'pass' ? 1 : status === 'partial' ? 0.6 : 0;

    // Mention unsupported/ignored directives for transparency
    const recognizedKeys = new Set(criticalFeatures.map(item => item.name));
    const additionalFeatures = Array.from(directives.keys()).filter(key => !recognizedKeys.has(key));
    if (additionalFeatures.length > 0) {
      infoNotes.push(`Additional directives detected: ${additionalFeatures.join(', ')}.`);
    }

    const notes = [
      `Observed Permissions-Policy: ${value}`,
      ...failReasons.map(reason => `❌ ${reason}`),
      ...warnReasons.map(reason => `⚠️ ${reason}`),
      ...infoNotes.map(reason => `ℹ️ ${reason}`),
    ];

    return {
      scoreDelta: context.weight * multiplier,
      status,
      notes,
    };
  },
};
