import React from 'react';
import { TabsContent, Tabs } from '@/components/ui/tabs';
import { HeadersSectionProps, HeaderTabType } from '../../types/reportTypes';
import { useHeaderTabs } from '../../hooks/useHeaderTabs';
import { HeaderTabs } from './HeaderTabs';
import { HeaderList } from './HeaderList';

/**
 * HeadersSection component for displaying tabs of different header categories
 */
export const HeadersSection: React.FC<HeadersSectionProps> = ({ headers }) => {
  const { activeTab, handleTabChange } = useHeaderTabs();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">HTTP Headers Analysis</h2>
      <div className="border rounded-md">
        <div className="p-4">
          <Tabs value={activeTab} className="w-full">
            <HeaderTabs activeTab={activeTab} onTabChange={handleTabChange} />
            
            <div className="mt-4">
              <TabsContent value={HeaderTabType.DETECTED}>
                <HeaderList headers={headers.detected} type={HeaderTabType.DETECTED} />
              </TabsContent>
              
              <TabsContent value={HeaderTabType.MISSING}>
                <HeaderList headers={headers.missing} type={HeaderTabType.MISSING} />
              </TabsContent>
              
              <TabsContent value={HeaderTabType.LEAKING}>
                <HeaderList headers={headers.leaking} type={HeaderTabType.LEAKING} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
