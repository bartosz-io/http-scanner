import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HeaderListProps, HeaderTabType } from '../../types/reportTypes';

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
                    {header.value 
                      ? (header.value.length > 100 
                          ? `${header.value.substring(0, 100)}...` 
                          : header.value)
                      : <span className="italic text-muted-foreground">Not present</span>
                    }
                  </td>
                  <td className="p-3 text-center border-b">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </td>
                </tr>
                
                {isExpanded && (
                  <tr>
                    <td colSpan={3} className="p-0 border-b">
                      <div className="p-4 bg-muted/20">
                        {header.value && (
                          <div className="mb-3">
                            <div className="text-sm font-medium mb-1">Value:</div>
                            <div className="bg-muted rounded p-2 overflow-x-auto text-sm font-mono text-left">
                              {header.value}
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-1">Weight:</div>
                          <div className="text-sm text-left">{header.weight} point{Math.abs(header.weight) !== 1 ? 's' : ''}</div>
                        </div>
                        
                        <div>
                          {type === HeaderTabType.DETECTED && (
                            <p className="text-sm">This security header is properly configured on your site.</p>
                          )}
                          {type === HeaderTabType.MISSING && (
                            <div className="space-y-2">
                              <p className="text-sm">This security header is missing from your site.</p>
                            </div>
                          )}
                          {type === HeaderTabType.LEAKING && (
                            <div className="space-y-2">
                              <p className="text-sm">
                                This header may leak sensitive information about your infrastructure.
                                Consider removing it to improve security.
                              </p>
                              <a href="https://dev-academy.com/security-headers#leaking-headers" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline text-sm inline-block"
                              >
                                Learn about leaking headers
                              </a>
                            </div>
                          )}
                        </div>
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
