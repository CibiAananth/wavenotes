import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/home';
import RecordingPage from '@/pages/recorder';

export const router = createBrowserRouter([
  {
    path: '/',
    index: true,
    Component: Home,
  },
  {
    path: '/recording/new',
    index: true,
    Component: RecordingPage,
  },
]);
