import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeaderTabType, HeaderTabsProps } from '../../types/reportTypes';

/**
 * HeaderTabs component for navigating between different header categories
 */
export const HeaderTabs: React.FC<HeaderTabsProps> = ({ activeTab, onTabChange }) => {
  const handleTabChange = (value: string) => {
    onTabChange(value as HeaderTabType);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger 
          value={HeaderTabType.DETECTED} 
          className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
        >
          Detected
        </TabsTrigger>
        <TabsTrigger 
          value={HeaderTabType.MISSING} 
          className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800"
        >
          Missing
        </TabsTrigger>
        <TabsTrigger 
          value={HeaderTabType.LEAKING} 
          className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800"
        >
          Leaking
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
