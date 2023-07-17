import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/home/home';
import RecordingPage from '@/pages/recording/recording';

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
