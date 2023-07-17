import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import AppShell from '@/components/layout/app-shell';
import { router } from '@/router';
import { ThemeProvider } from '@/context/theme-provider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <ThemeProvider>
      <AppShell>
        <RouterProvider router={router} />
      </AppShell>
    </ThemeProvider>
  </StrictMode>
);
