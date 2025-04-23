import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './components/HomePage';

// Define routes using hash routing as specified in the implementation plan
const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/report/:hash',
    // This would be implemented in a separate component
    element: <div>Report Details Page (To be implemented)</div>
  },
  {
    path: '/reports',
    // This would be implemented in a separate component
    element: <div>All Reports Page (To be implemented)</div>
  },
  {
    path: '*',
    element: <div>404 Page Not Found</div>
  }
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
