import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

const Home = lazy(() => import('@/pages/home'));
const RecordingPage = lazy(() => import('@/pages/recorder'));

export const router = createBrowserRouter([
  {
    path: '/',
    index: true,
    element: (
      <Suspense>
        <Home />
      </Suspense>
    ),
  },
  {
    path: '/recording/new',
    index: true,
    element: (
      <Suspense>
        <RecordingPage />
      </Suspense>
    ),
  },
]);
