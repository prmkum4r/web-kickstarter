// Architecture boundaries shared by both stacks. See docs/architecture.md § Boundaries.

const FRAMEWORK_IMPORTS = [
  {
    group: ['next', 'next/*', 'react-router', 'react-router/*', 'react-router-dom'],
    message: 'Framework APIs live in src/app and src/platform only. Use @/platform/router.',
  },
]

const FEATURE_INTERNALS = {
  group: ['@/features/*/*'],
  message: "Import another feature through its public index (@/features/<name>). Inside a feature, use relative imports.",
}

const WRAPPED_ANTD = {
  name: 'antd',
  importNames: ['Button', 'Input', 'Select', 'Form', 'Modal', 'message'],
  message: 'Use the wrapper in @/components/custom/ (and useToast() instead of message).',
}

const restrictedImports = ({ framework = true, antd = true } = {}) => [
  'error',
  {
    paths: antd ? [WRAPPED_ANTD] : [],
    patterns: [...(framework ? FRAMEWORK_IMPORTS : []), FEATURE_INTERNALS],
  },
]

const ENV_ACCESS = [
  'error',
  {
    selector: "MemberExpression[object.name='process'][property.name='env']",
    message: 'Read configuration through @/config/env. Only src/platform/env.ts touches env globals.',
  },
  {
    selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
    message: 'Read configuration through @/config/env. Only src/platform/env.ts touches env globals.',
  },
]

export const sharedIgnores = ['coverage/**', 'playwright-report/**', 'test-results/**', 'playwright/.auth/**']

export const sharedRules = [
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedImports(),
      'no-restricted-syntax': ENV_ACCESS,
    },
  },
  {
    files: ['src/components/custom/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports({ antd: false }) },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/platform/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrictedImports({ framework: false }) },
  },
  {
    files: ['src/platform/env.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]
