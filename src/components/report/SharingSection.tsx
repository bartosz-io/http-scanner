import React from 'react';
import { Button } from '@/components/ui/button';
import { SharingSectionProps } from '../../types/reportTypes';

/**
 * SharingSection component for sharing the report on social media
 */
export const SharingSection: React.FC<SharingSectionProps> = ({ url, score, hash, shareImageUrl }) => {
  // Generate share text
  const shareText = `I scored ${score}/100 on security headers for ${url} with HTTP Scanner!`;
  
  // Generate share URLs
  const getLinkedInShareUrl = () => {
    const params = new URLSearchParams({
      url: `${window.location.origin}/#/report/${hash}`,
      title: 'HTTP Security Headers Check',
      summary: shareText,
      source: 'HTTP Scanner'
    });

    return `https://www.linkedin.com/shareArticle?mini=true&${params.toString()}`;
  };

  const getTwitterShareUrl = () => {
    const params = new URLSearchParams({
      text: shareText,
      url: `${window.location.origin}/#/report/${hash}`
    });

    return `https://twitter.com/intent/tweet?${params.toString()}`;
  };

  // Handle share button clicks
  const handleShare = (platform: 'linkedin' | 'twitter') => {
    const shareUrl = platform === 'linkedin' ? getLinkedInShareUrl() : getTwitterShareUrl();
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="h-full">
      <div className="border rounded-md h-full flex flex-col overflow-hidden">
        <div className="bg-muted px-6 py-3">
          <h2 className="text-xl font-semibold">Share Your Results</h2>
        </div>
        <div className="p-6 flex-grow flex flex-col">
          <div className="space-y-4 flex-grow flex flex-col">
            <p>Proud of your security score? Share it with others!</p>
            
            {shareImageUrl && (
              <div className="mb-4">
                <img 
                  src={shareImageUrl} 
                  alt="Security Score Share Image" 
                  className="w-full max-w-md mx-auto rounded-md border"
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={() => handleShare('linkedin')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                </svg>
                Share on LinkedIn
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={() => handleShare('twitter')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#1DA1F2]">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Share on Twitter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
