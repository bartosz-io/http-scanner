import React from 'react';
import { NavigationMenu } from './NavigationMenu';
import scannerLogo from '../assets/scanner-logo.png';

export const Header: React.FC = () => {
  return (
    <header className="bg-background border-b border-border py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src={scannerLogo} 
            alt="HTTP Scanner Logo" 
            className="h-8 w-8" 
          />
          <h1 className="text-xl font-bold">HTTP Scanner</h1>
        </div>
        <NavigationMenu />
      </div>
    </header>
  );
};
