import { ScoreNormalizerService as ScoreNormalizerServiceInterface } from '../../interfaces/services/ScoreNormalizerService';

/**
 * Implementation of the score normalizer service
 */
export class ScoreNormalizerService implements ScoreNormalizerServiceInterface {
  /**
   * Normalizes a raw score to a 0-100 scale using min-max normalization
   * @param rawScore The raw score to normalize
   * @param baseScore The base score all calculations start from
   * @param positiveWeights Array of positive weight values
   * @param negativeWeights Array of negative weight values
   * @returns Normalized score between 0 and 100
   */
  normalize(rawScore: number, baseScore: number, positiveWeights: number[], negativeWeights: number[]): number {
    // Calculate the maximum possible score: baseScore + all positive weights
    const totalPositiveWeight = positiveWeights.reduce((sum, weight) => sum + weight, 0);
    const maxPossibleScore = baseScore + totalPositiveWeight;
    
    // Calculate the minimum possible score: baseScore + all negative weights
    const totalNegativeWeight = negativeWeights.reduce((sum, weight) => sum + weight, 0);
    const minPossibleScore = baseScore + totalNegativeWeight;
    
    // Calculate the score range
    const scoreRange = maxPossibleScore - minPossibleScore;
    
    // Normalize using the formula: ((score - min) / (max - min)) * 100
    let normalizedScore = ((rawScore - minPossibleScore) / scoreRange) * 100;
    
    // Ensure score is within valid range
    normalizedScore = Math.max(0, Math.min(100, normalizedScore));
    
    return normalizedScore;
  }
}
