// @ts-check
import { baseConfig } from '@repo/eslint-config'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import { configs as tseslintConfigs } from 'typescript-eslint'

export default [
  { ignores: ['eslint.config.mjs'] },
  baseConfig,
  ...tseslintConfigs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
]
