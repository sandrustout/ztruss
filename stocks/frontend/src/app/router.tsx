import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { TripsPage } from '../pages/TripsPage';
import { HistoryPage } from '../pages/HistoryPage';
import { AboutPage } from '../pages/AboutPage';
import { SearchPage } from '../pages/SearchPage';
import { DestinationPage } from '../pages/DestinationPage';
import { TripPlannerPage } from '../pages/TripPlannerPage';
import { TripBillPage } from '../pages/TripBillPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'destination/:id', element: <DestinationPage /> },
      {
        path: 'trip/:tripId',
        element: (
          <ProtectedRoute>
            <TripPlannerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'trip/:tripId/bill',
        element: (
          <ProtectedRoute>
            <TripBillPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'trips',
        element: (
          <ProtectedRoute>
            <TripsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'history',
        element: (
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
