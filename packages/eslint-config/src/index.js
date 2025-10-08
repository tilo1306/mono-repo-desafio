import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        node: true,
        es2022: true,
        browser: true,
      },
    },
  },
]

export const reactConfig = [
  ...baseConfig,
  {
    plugins: {
      'react-hooks': await import('eslint-plugin-react-hooks'),
      'react-refresh': await import('eslint-plugin-react-refresh'),
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]

export default baseConfig
