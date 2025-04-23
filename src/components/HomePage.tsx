import React from 'react';
import { Header } from './Header';
import { ScanSection } from './ScanSection';
import { RecentScansSection } from './RecentScansSection.tsx';
import { Footer } from './Footer.tsx';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <ScanSection />
        <RecentScansSection />
      </main>
      <Footer />
    </div>
  );
};
