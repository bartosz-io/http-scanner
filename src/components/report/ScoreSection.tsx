import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScoreSectionProps } from '../../types/reportTypes';
import { ScoreGauge } from './ScoreGauge';

/**
 * ScoreSection component displaying the security score with contextual messages
 */
export const ScoreSection: React.FC<ScoreSectionProps> = ({ score }) => {
  // Generate message based on score
  const getMessage = (score: number): { title: string; description: string } => {
    if (score >= 80) {
      return {
        title: 'Excellent security configuration!',
        description: 'Your site has a strong security header configuration. Keep up the good work!'
      };
    } else if (score >= 60) {
      return {
        title: 'Good security configuration',
        description: 'Your site has a decent security header setup, but there is room for improvement.'
      };
    } else if (score >= 40) {
      return {
        title: 'Moderate security configuration',
        description: 'Your site has some security headers in place, but requires significant improvements.'
      };
    } else {
      return {
        title: 'Poor security configuration',
        description: 'Your site is missing many critical security headers. Consider implementing the missing headers as soon as possible.'
      };
    }
  };

  const message = getMessage(score);

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score gauge visualization */}
          <div className="md:w-1/3">
            <ScoreGauge score={score} />
          </div>
          
          {/* Score description */}
          <div className="md:w-2/3 space-y-4">
            <h2 className="text-xl font-semibold">{message.title}</h2>
            <p>{message.description}</p>
            
            {score < 70 && (
              <div className="text-sm">
                <p>Review the missing security headers below to improve your score. Each security header adds valuable protection to your website and users.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
