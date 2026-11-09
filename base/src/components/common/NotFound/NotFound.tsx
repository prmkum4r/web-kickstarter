'use client'

import { Result } from 'antd'
import type { FC } from 'react'
import Button from '@/components/custom/Button/Button'
import { PATHS } from '@/config/routes'
import { useNavigate } from '@/platform/router'

const NotFound: FC = () => {
  const navigate = useNavigate()

  return (
    <div data-testid="not-found">
      <Result
        status="404"
        title="Page not found"
        subTitle="The page you're looking for doesn't exist or has moved."
        extra={
          <Button type="primary" onClick={() => navigate(PATHS.HOME)}>
            Back to home
          </Button>
        }
      />
    </div>
  )
}

export default NotFound
