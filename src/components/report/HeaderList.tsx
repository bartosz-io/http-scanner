import React from 'react';
import { Search } from 'lucide-react';
import { HeaderListProps } from '@/types/reportTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HeaderCard } from './HeaderCard';

type HeaderItem = HeaderListProps['headers'][number];

const emptyStateMessage: Record<HeaderListProps['type'], string> = {
  detected: 'No security headers detected.',
  missing: 'No missing security headers. Great job!',
  leaking: 'No leaking headers found. Great job!',
};

const filterOptions: Array<{ label: string; value: HeaderItem['status'] | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Action required', value: 'fail' },
  { label: 'Needs review', value: 'partial' },
  { label: 'Pass', value: 'pass' },
];

const sortByWeight = (a: HeaderItem, b: HeaderItem) => {
  const weightA = a.weight ?? 0;
  const weightB = b.weight ?? 0;
  return Math.abs(weightB) - Math.abs(weightA);
};

/**
 * HeaderList component renders each header as a learning-focused card with filters
 */
export const HeaderList: React.FC<HeaderListProps> = ({ headers, type }) => {
  const [statusFilter, setStatusFilter] = React.useState<HeaderItem['status'] | 'all'>('all');
  const [query, setQuery] = React.useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredHeaders = React.useMemo(() => {
    return [...headers]
      .sort(sortByWeight)
      .filter(header => {
        const statusMatch = statusFilter === 'all' || header.status === statusFilter;
        const queryMatch =
          normalizedQuery.length === 0 ||
          header.name.toLowerCase().includes(normalizedQuery) ||
          header.value?.toLowerCase().includes(normalizedQuery) ||
          header.notes?.some(note => note.toLowerCase().includes(normalizedQuery));
        return statusMatch && queryMatch;
      });
  }, [headers, normalizedQuery, statusFilter]);

  if (headers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyStateMessage[type]}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(filter => (
            <Button
              key={filter.label}
              variant={statusFilter === filter.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search headers"
            className="pl-9"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </div>
      </div>

      {filteredHeaders.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No headers match your filters yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHeaders.map(header => (
            <HeaderCard key={header.name} header={header} type={type} />
          ))}
        </div>
      )}
    </div>
  );
};
