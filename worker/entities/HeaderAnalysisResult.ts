import { HeaderEntry } from './HeaderEntry';

export interface HeaderAnalysisResult {
  detected: HeaderEntry[];
  missing: HeaderEntry[];
  leaking: HeaderEntry[];
  score: number;
}
