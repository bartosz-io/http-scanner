import React from 'react';
import {
  createHashRouter,
  RouterProvider,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ReportView } from './components/report/ReportView';
import { NotFoundPage } from './components/NotFoundPage';

const LegacyReportRoute: React.FC = () => {
  const { hash = '' } = useParams<{ hash: string }>();
  const [searchParams] = useSearchParams();

  return <ReportView hash={hash} token={searchParams.get('token')} />;
};

// Define routes using hash routing as specified in the implementation plan
const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/report/:hash',
    element: <LegacyReportRoute />
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
