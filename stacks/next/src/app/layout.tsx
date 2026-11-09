import { AntdRegistry } from '@ant-design/nextjs-registry'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import AppLayout from '@/components/layout/AppLayout/AppLayout'
import { env } from '@/config/env'
import AppProviders from '@/providers/AppProviders'
import '@/styles/globals.scss'

export const metadata: Metadata = {
  title: env.appName,
  icons: { icon: '/favicon.svg' },
}

// Routing layer only: providers + shell, then the page. Pages come from src/features.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AppProviders>
            <AppLayout>{children}</AppLayout>
          </AppProviders>
        </AntdRegistry>
      </body>
    </html>
  )
}
