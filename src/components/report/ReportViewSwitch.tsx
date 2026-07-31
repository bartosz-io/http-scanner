import React from 'react';
import { cn } from '@/lib/utils';
import type { ReportViewSwitchProps } from '@/types/reportTypes';

const options = [
  { value: 'security-analysis', label: 'Security analysis' },
  { value: 'all-headers', label: 'All response headers' },
] as const;

export const ReportViewSwitch: React.FC<ReportViewSwitchProps> = ({
  value,
  onChange,
}) => {
  return (
    <div
      className="inline-flex w-full rounded-lg border bg-muted/40 p-1 sm:w-auto"
      role="group"
      aria-label="Report view"
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-none',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
            )}
            onClick={() => {
              if (!isActive) {
                onChange(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
