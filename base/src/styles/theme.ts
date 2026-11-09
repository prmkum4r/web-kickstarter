import type { ThemeConfig } from 'antd'

// AntD derives its whole palette from these seeds, so they must be real values, not CSS variables.
// Keep them identical to the matching tokens in _tokens.scss.
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#4f46e5',
    colorSuccess: '#15803d',
    colorWarning: '#b45309',
    colorError: '#b91c1c',
    colorInfo: '#1d4ed8',
    colorTextBase: '#111827',
    colorBgLayout: '#f6f7f9',
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerPadding: '0 24px',
      bodyBg: '#f6f7f9',
    },
  },
}
