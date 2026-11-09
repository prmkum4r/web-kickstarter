import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { sharedIgnores, sharedRules } from './eslint.shared.mjs'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...sharedRules,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', ...sharedIgnores]),
])
