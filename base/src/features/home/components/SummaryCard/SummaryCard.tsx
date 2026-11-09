'use client'

import { Card, Statistic } from 'antd'
import type { FC } from 'react'
import type { HomeStat } from '../../types'
import styles from './SummaryCard.module.scss'

interface SummaryCardProps {
  stat: HomeStat
}

const SummaryCard: FC<SummaryCardProps> = ({ stat }) => (
  <Card className={styles.root} data-testid="summary-card">
    <Statistic title={stat.label} value={stat.value} />
    {stat.hint ? <p className={styles.hint}>{stat.hint}</p> : null}
  </Card>
)

export default SummaryCard
