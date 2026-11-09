import { createBrowserRouter, Outlet } from 'react-router'
import NotFound from '@/components/common/NotFound/NotFound'
import AppLayout from '@/components/layout/AppLayout/AppLayout'
import { PATHS } from '@/config/routes'

// Routing layer only: map PATHS to feature pages. Pages are lazy so each feature is its own chunk.
export const router = createBrowserRouter([
  {
    element: (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
    children: [
      {
        path: PATHS.HOME,
        lazy: async () => ({ Component: (await import('@/features/home')).HomePage }),
      },
      { path: '*', Component: NotFound },
    ],
  },
])
