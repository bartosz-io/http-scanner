import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HeaderListProps, HeaderTabType } from '../../types/reportTypes';

const statusConfig: Record<
  NonNullable<HeaderListProps['headers'][number]['status']> | 'unknown',
  { label: string; className: string }
> = {
  pass: { label: 'Pass', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  partial: { label: 'Needs review', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  fail: { label: 'Action required', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  missing: { label: 'Missing', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  unknown: { label: 'Not evaluated', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

const renderStatusBadge = (status?: HeaderListProps['headers'][number]['status']) => {
  const key = status ?? 'unknown';
  const config = statusConfig[key] ?? statusConfig.unknown;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

/**
 * HeaderList component for displaying a list of headers in a table-like format with expandable details
 */
export const HeaderList: React.FC<HeaderListProps> = ({ headers, type }) => {
  const [expandedHeaders, setExpandedHeaders] = React.useState<string[]>([]);

  // Handle expanding/collapsing a header panel
  const toggleExpand = (name: string) => {
    setExpandedHeaders(prev => 
      prev.includes(name) 
        ? prev.filter(h => h !== name) 
        : [...prev, name]
    );
  };

  const getHeaderTypeClasses = (header: { weight?: number }) => {
    switch (type) {
      case HeaderTabType.DETECTED:
        // Only show green for headers with non-zero weight (from configuration)
        return header.weight !== 0 ? 'border-l-4 border-l-green-500' : '';
      case HeaderTabType.MISSING:
        return 'border-l-4 border-l-amber-500';
      case HeaderTabType.LEAKING:
        return 'border-l-4 border-l-red-500';
      default:
        return '';
    }
  };

  // No headers to display
  if (headers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === HeaderTabType.DETECTED && 'No security headers detected.'}
        {type === HeaderTabType.MISSING && 'No missing security headers. Great job!'}
        {type === HeaderTabType.LEAKING && 'No leaking headers found. Great job!'}
      </div>
    );
  }

  // Sort headers by weight in descending order (highest weight first)
  const sortedHeaders = [...headers].sort((a, b) => {
    // Handle undefined weights
    const weightA = a.weight !== undefined ? a.weight : 0;
    const weightB = b.weight !== undefined ? b.weight : 0;
    
    // Sort by absolute weight value (descending)
    return Math.abs(weightB) - Math.abs(weightA);
  });

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col style={{ width: '40%' }} />
          <col style={{ width: '55%' }} />
          <col style={{ width: '5%' }} />
        </colgroup>
        <tbody>
          {sortedHeaders.map(header => {
            const isExpanded = expandedHeaders.includes(header.name);
            
            return (
              <React.Fragment key={header.name}>
                <tr 
                  className={`${getHeaderTypeClasses(header)} cursor-pointer hover:bg-muted/50`}
                  onClick={() => toggleExpand(header.name)}
                >
                  <td className="p-3 font-medium text-left border-b">
                    {header.name}
                  </td>
                  <td className="p-3 text-left text-muted-foreground border-b truncate">
                    <div className="flex flex-col gap-1">
                      {header.value 
                        ? (header.value.length > 100 
                            ? `${header.value.substring(0, 100)}...` 
                            : header.value)
                        : <span className="italic text-muted-foreground">Not present</span>
                      }
                      <span>{renderStatusBadge(header.status)}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center border-b">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </td>
                </tr>
                
                {isExpanded && (
                  <tr>
                    <td colSpan={3} className="p-0 border-b">
                      <div className="p-0">
                        <table className="w-full border-t">
                          <colgroup>
                            <col style={{ width: '40%' }} />
                            <col style={{ width: '40%' }} />
                            <col style={{ width: '20%' }} />
                          </colgroup>
                          <tbody>
                            <tr>
                              <td className="p-4 align-top">
                                <div className="text-sm font-medium mb-1">What this header means:</div>
                                <div className="text-sm text-muted-foreground space-y-2">
                                  {header.notes && header.notes.length > 0 ? (
                                    <ul className="list-disc pl-4 space-y-1">
                                      {header.notes.map(note => (
                                        <li key={note}>{note}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="italic">No analyzer notes available yet.</p>
                                  )}
                                </div>
                              </td>
                              
                              <td className="p-4 align-top">
                                <div className="text-sm font-medium mb-1">Value:</div>
                                {header.value ? (
                                  <div className="bg-muted rounded p-2 overflow-x-auto text-sm font-mono text-left">
                                    {header.value}
                                  </div>
                                ) : (
                                  <div className="bg-muted rounded p-2 text-sm italic text-muted-foreground">
                                    Not present
                                  </div>
                                )}
                              </td>
                              
                              <td className="p-4 align-top">
                                <div className="text-sm font-medium mb-1">Weight:</div>
                                <div className="text-sm">
                                  {header.weight} point{Math.abs(header.weight) !== 1 ? 's' : ''}
                                </div>

                                <div className="mt-4 space-y-2">
                                  <div className="text-sm font-medium">Status</div>
                                  {renderStatusBadge(header.status)}
                                  {type === HeaderTabType.MISSING && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      This security header is missing from your site.
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
