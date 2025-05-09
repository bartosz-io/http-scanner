import { useState, useCallback } from 'react';
import { HeaderTabType } from '../types/reportTypes';

/**
 * Custom hook for managing header tab navigation
 */
export function useHeaderTabs() {
  const [activeTab, setActiveTab] = useState<HeaderTabType>(HeaderTabType.DETECTED);
  
  const handleTabChange = useCallback((tab: HeaderTabType) => {
    setActiveTab(tab);
  }, []);
  
  return {
    activeTab,
    handleTabChange
  };
}
