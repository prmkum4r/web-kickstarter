import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { sharedIgnores, sharedRules } from './eslint.shared.mjs'

export default defineConfig([
  globalIgnores(['dist/**', ...sharedIgnores]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  ...sharedRules,
  {
    // Adapters export hooks next to Link by design; fast refresh of this file isn't needed.
    files: ['src/platform/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
