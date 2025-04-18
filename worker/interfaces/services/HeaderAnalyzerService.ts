import { HeaderAnalysisResult } from '../../entities/HeaderAnalysisResult';

export interface HeaderAnalyzerService {
  /**
   * Analyze HTTP headers and calculate security score
   * @param headers The HTTP headers to analyze
   */
  analyze(headers: Record<string, string>): Promise<HeaderAnalysisResult>;
}
