'use client'

import { Empty, Result, Skeleton } from 'antd'
import type { FC, ReactNode } from 'react'
import Button from '@/components/custom/Button/Button'
import type { AppError } from '@/lib/api/errors'
import styles from './PageState.module.scss'

interface PageStateProps {
  loading: boolean
  error: AppError | null
  /** True when the request succeeded but returned nothing. */
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: ReactNode
  /** Call-to-action rendered under the empty state. */
  emptyAction?: ReactNode
  onRetry?: () => void
  skeletonRows?: number
  children: ReactNode
}

/**
 * The one place Loading / Error / Empty / Success is decided, so every data screen
 * behaves the same instead of each page inventing its own states.
 */
const PageState: FC<PageStateProps> = ({
  loading,
  error,
  isEmpty = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  onRetry,
  skeletonRows = 3,
  children,
}) => {
  if (loading) {
    return (
      <div className={styles.root} aria-busy="true" aria-live="polite" data-testid="page-state-loading">
        {Array.from({ length: skeletonRows }, (_, index) => (
          <Skeleton key={index} active paragraph={{ rows: 2 }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.root} data-testid="page-state-error">
        <Result
          status={error.code === 'forbidden' ? '403' : 'warning'}
          title="We hit a problem"
          subTitle={error.message}
          extra={
            onRetry ? (
              <Button type="primary" onClick={onRetry}>
                Try again
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={styles.root} data-testid="page-state-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className={styles.empty}>
              <span className={styles.emptyTitle}>{emptyTitle}</span>
              {emptyDescription ? <span className={styles.emptyDescription}>{emptyDescription}</span> : null}
            </span>
          }
        >
          {emptyAction}
        </Empty>
      </div>
    )
  }

  return <>{children}</>
}

export default PageState
