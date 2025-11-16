import React from 'react';
interface CspDirective {
  directive: string;
  values: string;
}

const formatCspValue = (value: string): CspDirective[] => {
  return value
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [directive, ...rest] = part.split(/\s+/);
      if (rest.length === 0) {
        return {
          directive: `${directive};`,
          values: '',
        };
      }
      return {
        directive,
        values: `${rest.join(' ').replace(/\n/g, '\n    ')};`,
      };
    });
};

interface FormattedHeaderValueProps {
  headerName: string;
  value: string;
}

export const FormattedHeaderValue: React.FC<FormattedHeaderValueProps> = ({ headerName, value }) => {
  const normalized = headerName.toLowerCase();

  if (normalized === 'content-security-policy') {
    const directives = formatCspValue(value);

    if (directives.length === 0) {
      return <div className="whitespace-pre-wrap">{value}</div>;
    }

    return (
      <div className="space-y-1">
        {directives.map(item => (
          <div key={`${item.directive}-${item.values}`} className="font-mono text-sm leading-relaxed">
            <div className="font-semibold text-primary">{item.directive}</div>
            {item.values && <div className="ml-4 text-muted-foreground">{item.values}</div>}
          </div>
        ))}
      </div>
    );
  }

  return <div className="whitespace-pre-wrap">{value}</div>;
};
