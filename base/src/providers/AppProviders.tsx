'use client'

import { App, ConfigProvider } from 'antd'
import type { FC, ReactNode } from 'react'
import MissingConfig from '@/components/common/MissingConfig/MissingConfig'
import { validateEnv } from '@/config/env'
import { antdTheme } from '@/styles/theme'

interface AppProvidersProps {
  children: ReactNode
}

// Checked once at module load: env is inlined at build time and cannot change while the app runs.
const environment = validateEnv()

/**
 * Every app-wide provider, in one place, shared by both stacks.
 * `App` gives AntD's message/modal/notification access to the theme (see useToast).
 */
const AppProviders: FC<AppProvidersProps> = ({ children }) => (
  <ConfigProvider theme={antdTheme}>
    <App>{environment.valid ? children : <MissingConfig missing={environment.missing} />}</App>
  </ConfigProvider>
)

export default AppProviders
