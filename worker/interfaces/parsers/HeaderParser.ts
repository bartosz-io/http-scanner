export type HeaderEvaluationStatus = 'pass' | 'partial' | 'fail' | 'missing' | 'unknown';

export interface HeaderEvaluation {
  scoreDelta: number;
  status: HeaderEvaluationStatus;
  notes: string[];
}

export interface HeaderParserContext {
  headerName: string;
  weight: number;
  allHeaders: Record<string, string>;
}

export interface HeaderParser {
  readonly headerName: string;
  evaluate(value: string | undefined, context: HeaderParserContext): HeaderEvaluation;
}
