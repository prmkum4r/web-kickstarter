'use client'

import { Result } from 'antd'
import type { FC } from 'react'
import styles from './MissingConfig.module.scss'

interface MissingConfigProps {
  missing: string[]
}

// Shown instead of the app when required env vars are absent, so setup mistakes are obvious.
const MissingConfig: FC<MissingConfigProps> = ({ missing }) => (
  <main className={styles.root} data-testid="missing-config">
    <Result
      status="warning"
      title="This app isn't configured yet"
      subTitle={
        <>
          Set <code>{missing.join(', ')}</code> in <code>.env.local</code> (see <code>.env.example</code>), then restart
          the dev server.
        </>
      }
    />
  </main>
)

export default MissingConfig
