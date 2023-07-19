import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

import { ThemeProvider } from '@/context/theme-provider';
import { UserProvider } from '@/context/user-context';

import AppShell from '@/components/layout/app-shell';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <AppShell>
          <RouterProvider router={router} />
        </AppShell>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>,
);
