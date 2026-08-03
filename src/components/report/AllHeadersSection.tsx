import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { HEADER_CATEGORIES, type HeaderCategory } from '@/lib/headerCatalog';
import { cn } from '@/lib/utils';
import type { AllHeadersSectionProps } from '@/types/reportTypes';
import { AllHeaderCard } from './AllHeaderCard';

type CategoryFilter = 'all' | HeaderCategory | 'Other';

const categoryOrder: Exclude<CategoryFilter, 'all'>[] = [
  ...HEADER_CATEGORIES,
  'Other',
];

export const AllHeadersSection: React.FC<AllHeadersSectionProps> = ({
  headers,
  linkGuides = false,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const categories = useMemo(
    () => categoryOrder.filter((category) => (
      headers.some((header) => header.category === category)
    )),
    [headers]
  );

  const filteredHeaders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return headers.filter((header) => {
      const matchesCategory = activeCategory === 'all' ||
        header.category === activeCategory;
      const matchesSearch = query.length === 0 ||
        header.name.toLocaleLowerCase().includes(query) ||
        header.displayName.toLocaleLowerCase().includes(query) ||
        (header.value ?? '').toLocaleLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, headers, search]);

  return (
    <section aria-labelledby="all-response-headers-heading" className="space-y-6">
      <div className="space-y-2">
        <h2 id="all-response-headers-heading" className="text-xl font-semibold">
          All response headers
        </h2>
        <p className="text-sm text-muted-foreground">
          {headers.length} response headers observed
        </p>
        <p className="text-sm text-muted-foreground">
          Known scanner-transport headers are excluded from this view.
        </p>
      </div>

      {headers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="font-medium">No response headers were observed</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The scanner did not receive any response headers it could display.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="response-header-search" className="text-sm font-medium">
                Search response headers
              </label>
              <Input
                id="response-header-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by header name or value"
              />
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter response headers by category"
            >
              {(['all', ...categories] as CategoryFilter[]).map((category) => {
                const isActive = category === activeCategory;
                const label = category === 'all' ? 'All categories' : category;

                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isActive}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-slate-200 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    onClick={() => setActiveCategory(category)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredHeaders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="font-medium">No response headers match your filters</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different search term or category.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredHeaders.map((header) => (
                <AllHeaderCard
                  key={header.name}
                  header={header}
                  linkGuides={linkGuides}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};
