import { getHeaderCatalogEntry } from './headerCatalog';

const REQUIRED_HEADINGS = [
  '## Meaning and behavior',
  '## Implementation notes',
] as const;

interface MarkdownSourceParts {
  frontmatter: string;
  body: string;
}

function splitMarkdownSource(source: string): MarkdownSourceParts {
  const lines = source.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: '', body: source };
  }

  const closingDelimiterIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '---'
  );

  if (closingDelimiterIndex === -1) {
    return { frontmatter: '', body: source };
  }

  return {
    frontmatter: lines.slice(1, closingDelimiterIndex).join('\n'),
    body: lines.slice(closingDelimiterIndex + 1).join('\n'),
  };
}

function parseScalar(value: string): string {
  const withoutComment = value.replace(/\s+#.*$/, '').trim();
  const quote = withoutComment[0];

  if (
    (quote === '"' || quote === "'")
    && withoutComment.at(-1) === quote
  ) {
    return withoutComment.slice(1, -1);
  }

  return withoutComment;
}

function findFrontmatterScalar(frontmatter: string, field: string): string {
  const fieldPattern = new RegExp(`^${field}:[ \\t]*(.*)$`, 'm');
  const match = frontmatter.match(fieldPattern);
  return match ? parseScalar(match[1]) : '';
}

function parseRelatedHeaders(frontmatter: string): string[] {
  const lines = frontmatter.split('\n');
  const fieldIndex = lines.findIndex((line) => /^relatedHeaders:[ \t]*/.test(line));
  if (fieldIndex === -1) {
    return [];
  }

  const inlineValue = lines[fieldIndex].replace(/^relatedHeaders:[ \t]*/, '').trim();
  if (inlineValue.startsWith('[') && inlineValue.endsWith(']')) {
    return inlineValue
      .slice(1, -1)
      .split(',')
      .map(parseScalar)
      .filter(Boolean);
  }

  const relatedHeaders: string[] = [];
  for (const line of lines.slice(fieldIndex + 1)) {
    if (/^[A-Za-z][A-Za-z0-9]*:/.test(line)) {
      break;
    }

    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem) {
      relatedHeaders.push(parseScalar(listItem[1]));
    }
  }

  return relatedHeaders;
}

function hasHeading(body: string, heading: string): boolean {
  return body.split('\n').some((line) => line.trimEnd() === heading);
}

function countWords(body: string): number {
  return body.match(/\S+/g)?.length ?? 0;
}

export function validateHeaderGuideSource(slug: string, source: string): string[] {
  const errors: string[] = [];
  const { frontmatter, body } = splitMarkdownSource(source);
  const headerName = findFrontmatterScalar(frontmatter, 'headerName');

  if (slug !== headerName) {
    errors.push(
      `Header slug "${slug}" does not match frontmatter headerName "${headerName}"`
    );
  }

  for (const heading of REQUIRED_HEADINGS) {
    if (!hasHeading(body, heading)) {
      errors.push(`Missing required heading: ${heading}`);
    }
  }

  if (countWords(body) < 180) {
    errors.push('Guide body must contain at least 180 words');
  }

  if (/client:/i.test(source)) {
    errors.push('Guide source must not contain client: directives');
  }

  if (/application\/ld\+json/i.test(source)) {
    errors.push('Guide source must not contain application/ld+json');
  }

  for (const relatedHeader of parseRelatedHeaders(frontmatter)) {
    if (!getHeaderCatalogEntry(relatedHeader)) {
      errors.push(`Unknown related header: ${relatedHeader}`);
    }
  }

  return errors;
}
