/**
 * The single error vocabulary the UI is allowed to see.
 *
 * Raw HTTP / fetch errors never leave the service layer: every service returns a
 * ServiceResult, so components branch on a known AppErrorCode instead of status codes.
 */

export const APP_ERROR_CODES = {
  AUTH: 'auth',
  VALIDATION: 'validation',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  NETWORK: 'network',
  UNEXPECTED: 'unexpected',
} as const

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES]

export interface AppError {
  code: AppErrorCode
  /** Safe to render directly to the user. */
  message: string
  /** HTTP status when the error came from a response. */
  status?: number
  /** Original error, kept for logging — never rendered. */
  cause?: unknown
}

export type ServiceResult<T> = { success: true; data: T } | { success: false; error: AppError }

export const ok = <T>(data: T): ServiceResult<T> => ({ success: true, data })

export const fail = <T = never>(error: AppError): ServiceResult<T> => ({ success: false, error })

export const appError = (code: AppErrorCode, message: string, extra: Pick<AppError, 'status' | 'cause'> = {}): AppError => ({
  code,
  message,
  ...extra,
})

export const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  auth: 'Your session has expired. Please sign in again.',
  validation: "That doesn't look right. Please check the details and try again.",
  forbidden: "You don't have permission to do that.",
  not_found: "We couldn't find what you were looking for.",
  conflict: 'That already exists.',
  network: 'Network problem. Check your connection and try again.',
  unexpected: 'Something went wrong. Please try again.',
}

const STATUS_CODES: Record<number, AppErrorCode> = {
  400: APP_ERROR_CODES.VALIDATION,
  401: APP_ERROR_CODES.AUTH,
  403: APP_ERROR_CODES.FORBIDDEN,
  404: APP_ERROR_CODES.NOT_FOUND,
  409: APP_ERROR_CODES.CONFLICT,
  422: APP_ERROR_CODES.VALIDATION,
}

// Only these codes may show the server's own message; the rest use product copy.
const SERVER_MESSAGE_CODES = new Set<AppErrorCode>([APP_ERROR_CODES.VALIDATION, APP_ERROR_CODES.CONFLICT])

const readServerMessage = (body: unknown): string => {
  if (typeof body !== 'object' || body === null) return ''
  const { message, error } = body as Record<string, unknown>
  if (typeof message === 'string') return message
  if (typeof error === 'string') return error
  return ''
}

/**
 * Maps a failed response onto an AppError.
 * `fallbackMessage` is what the user reads when nothing more specific applies — make it domain copy
 * ("We couldn't load your projects"), not a developer note.
 */
export const fromResponse = (status: number, body: unknown, fallbackMessage: string): AppError => {
  const code = STATUS_CODES[status] ?? APP_ERROR_CODES.UNEXPECTED
  if (code === APP_ERROR_CODES.UNEXPECTED) return appError(code, fallbackMessage, { status, cause: body })
  const serverMessage = SERVER_MESSAGE_CODES.has(code) ? readServerMessage(body) : ''
  return appError(code, serverMessage || DEFAULT_MESSAGES[code], { status, cause: body })
}

/** Maps anything thrown by fetch (offline, DNS, CORS, abort, bad JSON) onto an AppError. */
export const fromThrown = (thrown: unknown, fallbackMessage: string): AppError => {
  if (thrown instanceof TypeError) return appError(APP_ERROR_CODES.NETWORK, DEFAULT_MESSAGES.network, { cause: thrown })
  if (thrown instanceof DOMException && (thrown.name === 'AbortError' || thrown.name === 'TimeoutError')) {
    return appError(APP_ERROR_CODES.NETWORK, DEFAULT_MESSAGES.network, { cause: thrown })
  }
  return appError(APP_ERROR_CODES.UNEXPECTED, fallbackMessage, { cause: thrown })
}
