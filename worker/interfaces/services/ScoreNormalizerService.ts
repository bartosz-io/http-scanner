/**
 * Service for normalizing security scores
 */
export interface ScoreNormalizerService {
  /**
   * Normalizes a raw score to a 0-100 scale
   * @param rawScore The raw score to normalize
   * @param baseScore The base score all calculations start from
   * @param positiveWeights Array of positive weight values
   * @param negativeWeights Array of negative weight values
   * @returns Normalized score between 0 and 100
   */
  normalize(rawScore: number, baseScore: number, positiveWeights: number[], negativeWeights: number[]): number;
}
