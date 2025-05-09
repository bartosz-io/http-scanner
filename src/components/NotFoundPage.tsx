import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Button } from '@/components/ui/button';

/**
 * NotFoundPage component for displaying 404 errors
 */
export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-medium">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};
