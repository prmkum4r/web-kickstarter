import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import AppProviders from '@/providers/AppProviders'
import { router } from './router'
import '@/styles/globals.scss'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('#root is missing from index.html')

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
