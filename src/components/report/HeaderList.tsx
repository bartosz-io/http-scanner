import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeaderListProps, HeaderTabType } from '../../types/reportTypes';

/**
 * HeaderList component for displaying a list of headers with expandable details
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

  // Get color classes based on header type
  const getHeaderTypeClasses = () => {
    switch (type) {
      case HeaderTabType.DETECTED:
        return 'border-l-4 border-l-green-500';
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

  return (
    <div className="space-y-4">
      {headers.map(header => {
        const isExpanded = expandedHeaders.includes(header.name);
        
        return (
          <Card key={header.name} className={`${getHeaderTypeClasses()}`}>
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 rounded-none text-left" 
                onClick={() => toggleExpand(header.name)}
              >
                <div>
                  <span className="font-medium">{header.name}</span>
                  {header.value && (
                    <span className="text-sm block text-muted-foreground truncate max-w-full">
                      {header.value.length > 60 
                        ? `${header.value.substring(0, 60)}...` 
                        : header.value}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </Button>
              
              {isExpanded && (
                <div className="p-4 pt-0 border-t">
                  {header.value && (
                    <div className="mb-2">
                      <div className="text-sm font-medium">Value:</div>
                      <div className="bg-muted rounded p-2 overflow-x-auto text-sm font-mono text-left">
                        {header.value}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <div className="text-sm font-medium">Weight:</div>
                    <div className="text-sm text-left">{header.weight} point{Math.abs(header.weight) !== 1 ? 's' : ''}</div>
                  </div>
                  
                  <div className="mt-4">
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
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
