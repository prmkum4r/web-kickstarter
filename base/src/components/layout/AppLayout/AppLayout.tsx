'use client'

import { Layout } from 'antd'
import type { FC, ReactNode } from 'react'
import { env } from '@/config/env'
import { PATHS } from '@/config/routes'
import { Link } from '@/platform/router'
import styles from './AppLayout.module.scss'

interface AppLayoutProps {
  children: ReactNode
}

// App shell: header + centred content. Both stacks render every page inside it (see docs/platform.md).
const AppLayout: FC<AppLayoutProps> = ({ children }) => (
  <Layout className={styles.root}>
    <Layout.Header className={styles.header} data-testid="app-header">
      <Link to={PATHS.HOME} className={styles.brand}>
        {env.appName}
      </Link>
    </Layout.Header>
    <Layout.Content className={styles.content}>{children}</Layout.Content>
  </Layout>
)

export default AppLayout
