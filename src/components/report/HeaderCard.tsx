import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, ExternalLink, Info, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeaderEntry } from '@/types';
import { HeaderTabType } from '@/types/reportTypes';
import { getHeaderGuide } from '@/lib/headerGuides';
import { FormattedHeaderValue } from './FormattedHeaderValue';

const statusConfig: Record<
  NonNullable<HeaderEntry['status']> | 'unknown',
  { label: string; badgeClass: string; borderClass: string }
> = {
  pass: {
    label: 'Pass',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    borderClass: 'border-emerald-400',
  },
  partial: {
    label: 'Needs review',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    borderClass: 'border-amber-400',
  },
  fail: {
    label: 'Action required',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    borderClass: 'border-rose-400',
  },
  missing: {
    label: 'Missing',
    badgeClass: 'bg-slate-50 text-slate-700 border border-slate-200',
    borderClass: 'border-slate-400',
  },
  unknown: {
    label: 'Not evaluated',
    badgeClass: 'bg-slate-50 text-slate-700 border border-slate-200',
    borderClass: 'border-slate-300',
  },
};

const statusVisuals: Record<
  NonNullable<HeaderEntry['status']> | 'unknown',
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  pass: { icon: CheckCircle2, color: 'text-emerald-600' },
  partial: { icon: AlertTriangle, color: 'text-amber-600' },
  fail: { icon: AlertTriangle, color: 'text-rose-600' },
  missing: { icon: AlertTriangle, color: 'text-slate-500' },
  unknown: { icon: Info, color: 'text-slate-500' },
};

const formatPoints = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace(/\.0$/, '');
};

const resolveAwardedScore = (header: HeaderEntry): number => {
  if (typeof header.awardedScore === 'number') {
    return header.awardedScore;
  }

  const weight = header.weight ?? 0;

  if (header.leaking && weight < 0 && header.present) {
    return weight;
  }

  if (header.present) {
    return weight;
  }

  return 0;
};

const buildScoreSummary = (header: HeaderEntry, options?: { verbose?: boolean }): string => {
  const verbose = options?.verbose ?? false;
  const weight = header.weight ?? 0;
  const awardedRaw = resolveAwardedScore(header);

  if (weight > 0) {
    const awarded = Math.min(Math.max(awardedRaw, 0), weight);
    const summary = `${formatPoints(awarded)} / ${formatPoints(weight)} pts`;
    return verbose ? `${summary} earned` : summary;
  }

  if (weight < 0) {
    const maxPenalty = Math.abs(weight);
    const appliedPenalty = Math.abs(Math.min(awardedRaw, 0));
    const summary = `${formatPoints(appliedPenalty)} / ${formatPoints(maxPenalty)} pts penalty`;
    return verbose ? `${summary} applied` : summary;
  }

  const summary = `${formatPoints(awardedRaw)} pts`;
  return verbose ? `${summary} (informational)` : summary;
};

const useCopyToClipboard = () => {
  const [copiedValue, setCopiedValue] = React.useState<string | null>(null);

  const copy = async (value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setTimeout(() => setCopiedValue(null), 2500);
    } catch {
      // Clipboard API may fail (HTTP context); ignore silently
    }
  };

  return { copy, copiedValue };
};

interface HeaderCardProps {
  header: HeaderEntry;
  type: HeaderTabType;
}

const tabStatusLabel: Record<HeaderTabType, string> = {
  [HeaderTabType.DETECTED]: 'Detected',
  [HeaderTabType.MISSING]: 'Missing',
  [HeaderTabType.LEAKING]: 'Leaking',
};

export const HeaderCard: React.FC<HeaderCardProps> = ({ header, type }) => {
  const [expanded, setExpanded] = React.useState(false);
  const { copy, copiedValue } = useCopyToClipboard();
  const guide = getHeaderGuide(header.name);

  const statusKey = header.status ?? 'unknown';
  const status = statusConfig[statusKey] ?? statusConfig.unknown;
  const statusVisual = statusVisuals[statusKey] ?? statusVisuals.unknown;
  const StatusIcon = statusVisual.icon;
  const scoreSummary = buildScoreSummary(header);
  const primaryNote = header.notes?.[0];
  const summary = guide?.summary ?? primaryNote ?? 'We do not have analyzer notes for this header yet.';
  const riskExplanation = guide?.risk ?? summary;
  const tags = guide?.tags ?? [];
  const scannerNotes = header.notes ?? [];
  const bestPractices = guide?.bestPractices ?? [];
  const fixSteps = guide?.fixSteps ?? [];
  const hasGuidanceContent = Boolean(guide);
  const isDetectedNotEvaluated =
    type === HeaderTabType.DETECTED && statusKey === 'unknown' && !hasGuidanceContent && scannerNotes.length === 0;
  const friendlyName = header.name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');

  const detectedValue = header.value
    ? header.value
    : header.present
      ? 'Header present (value redacted)'
      : 'Not present';

  const handleToggle = () => {
    setExpanded(prev => !prev);
  };

  const renderTag = (tag: string) => {
    return (
      <span
        key={tag}
        className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-muted-foreground"
      >
        {tag}
      </span>
    );
  };

  if (isDetectedNotEvaluated) {
    return (
      <Card className="border border-dashed border-slate-200 bg-slate-50/60 text-left">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/80">
                <Info className="h-5 w-5 text-slate-600" />
              </div>
              <CardTitle className="text-lg font-semibold tracking-tight">{friendlyName}</CardTitle>
            </div>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              Not evaluated
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            We detected this header but have not published analyzer guidance yet. Track its value below while we
            expand coverage.
          </p>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Score impact:{' '}
            <span className="font-semibold text-foreground">
              {scoreSummary}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-900">Detected value</div>
            <div className="rounded-md border bg-white/70 p-3 text-sm font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
              <FormattedHeaderValue headerName={header.name} value={detectedValue} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border bg-white text-left shadow-[0_2px_6px_rgba(15,23,42,0.08)] transition-all',
        expanded ? 'ring-1 ring-ring' : 'hover:shadow-md'
      )}
    >
      <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <StatusIcon className={cn('h-5 w-5', statusVisual.color)} />
              </div>
              <CardTitle className="text-xl font-semibold tracking-tight">{friendlyName}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{summary}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="uppercase tracking-wide">
                {type === HeaderTabType.DETECTED ? 'Score impact' : `${tabStatusLabel[type]} header`}:
              </span>
              <span className="font-semibold text-foreground">{scoreSummary}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 text-right">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                status.badgeClass
              )}
            >
              {type === HeaderTabType.DETECTED ? status.label : tabStatusLabel[type]}
            </span>
            {tags.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 max-w-xs">
                {tags.map(renderTag)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-1 text-sm font-semibold"
          onClick={handleToggle}
          aria-expanded={expanded}
        >
          {expanded ? 'Hide details' : 'Show details'}
          <ChevronRight
            className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')}
          />
        </Button>

        {expanded && (
          <div className="space-y-6 border-t pt-4">
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                Why this matters
              </div>
              <p className="text-sm text-muted-foreground">{riskExplanation}</p>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="space-y-2">
                <div className="text-sm font-medium">Detected value</div>
                <div className="rounded-md border bg-muted/50 p-3 text-sm font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                  <FormattedHeaderValue headerName={header.name} value={detectedValue} />
                </div>
              </section>

              {guide?.recommendedValue && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Recommended directive</h3>
                    <button
                      type="button"
                      onClick={() => copy(guide.recommendedValue)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      <span>{copiedValue === guide.recommendedValue ? 'Copied' : 'Copy'}</span>
                      <ChevronRight className="h-3 w-3 rotate-90" />
                    </button>
                  </div>
                  <div className="rounded-md border bg-background/50 p-3 text-sm font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                    <FormattedHeaderValue headerName={header.name} value={guide.recommendedValue} />
                  </div>
                </section>
              )}
            </div>

            {fixSteps.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  How to fix it
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  {fixSteps.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            )}

            {scannerNotes.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4 text-slate-500" />
                  Analyzer findings
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {scannerNotes.map(note => (
                    <li key={note} className="leading-relaxed">
                      {note}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {bestPractices.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4 text-slate-500" />
                  Best practices
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {bestPractices.map(note => (
                    <li key={note} className="leading-relaxed">
                      {note}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {guide?.resources && guide.resources.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ExternalLink className="h-4 w-4" />
                  Dive deeper
                </div>
                <ul className="space-y-1 text-sm">
                  {guide.resources.map(link => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
