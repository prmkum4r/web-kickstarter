'use client'

import type { FC } from 'react'
import PageState from '@/components/common/PageState/PageState'
import SummaryCard from './components/SummaryCard/SummaryCard'
import { useHomeSummary } from './hooks/useHomeSummary'
import styles from './HomePage.module.scss'

const HomePage: FC = () => {
  const { data, error, loading, reload } = useHomeSummary()
  const stats = data?.stats ?? []

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <h1>{data?.title ?? 'Home'}</h1>
        {data ? <p className={styles.subtitle}>{data.subtitle}</p> : null}
      </header>

      <PageState
        loading={loading}
        error={error}
        isEmpty={stats.length === 0}
        emptyTitle="No stats yet"
        emptyDescription="Once the API returns data it shows up here."
        onRetry={reload}
      >
        <div className={styles.grid}>
          {stats.map((stat) => (
            <SummaryCard key={stat.id} stat={stat} />
          ))}
        </div>
      </PageState>
    </section>
  )
}

export default HomePage
