import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ReportView } from './components/report/ReportView';
import { NotFoundPage } from './components/NotFoundPage';

// Define routes using hash routing as specified in the implementation plan
const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/report/:hash',
    element: <ReportView />
  },
  {
    path: '/reports',
    // This would be implemented in a separate component
    element: <div>All Reports Page (To be implemented)</div>
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
