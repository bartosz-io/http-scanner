import React from 'react';
import { ScoreGaugeProps } from '../../types/reportTypes';

/**
 * ScoreGauge component displaying a circular gauge representing the security score
 */
export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  // Calculate the color based on the score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 60) return '#eab308'; // yellow-500
    if (score >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  // Calculate the stroke dash offset for the gauge
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex justify-center items-center">
      <div className="relative">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#e5e7eb" // gray-200
            strokeWidth="12"
          />
          {/* Score circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Score text in the center */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <div className="text-5xl font-bold">{Math.round(score)}</div>
          <div className="text-sm text-muted-foreground">Security Score</div>
        </div>
      </div>
    </div>
  );
};
