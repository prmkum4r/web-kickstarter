'use client'

import { App } from 'antd'
import type { AppError } from '@/lib/api/errors'

/**
 * The only sanctioned way to notify the user. Goes through AntD's App context (not the static
 * `message` export) so toasts inherit the theme. `showServiceError` takes an AppError straight
 * from a ServiceResult, so components never format error copy themselves.
 */
export const useToast = () => {
  const { message } = App.useApp()

  return {
    showSuccess: (content: string) => message.success(content),
    showError: (content: string) => message.error(content),
    showWarning: (content: string) => message.warning(content),
    showInfo: (content: string) => message.info(content),
    showServiceError: (error: AppError) => message.error(error.message),
  }
}
