import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

import { UserProvider } from '@/context/auth-provider';
import { DeviceProvider } from '@/context/device-provider';
import { ThemeProvider } from '@/context/theme-provider';
import AppShell from '@/components/layout/app-shell';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <DeviceProvider>
          <AppShell>
            <RouterProvider router={router} />
          </AppShell>
        </DeviceProvider>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>,
);
