import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AllHeaderCardProps } from '@/types/reportTypes';
import { FormattedHeaderValue } from './FormattedHeaderValue';

export const AllHeaderCard: React.FC<AllHeaderCardProps> = ({ header }) => {
  const displayedValue = header.value ?? 'Header present (value unavailable)';

  return (
    <Card className="min-w-0 max-w-full gap-4 border-slate-200 shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-4">
          <CardTitle className="break-all text-base font-semibold">
            {header.displayName}
          </CardTitle>
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {header.category}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {header.summary}
        </p>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full">
        <div className="w-full max-w-full overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          <FormattedHeaderValue
            headerName={header.name}
            value={displayedValue}
          />
        </div>
      </CardContent>
    </Card>
  );
};
