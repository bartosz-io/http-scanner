import js from '@eslint/js'
import astro from 'eslint-plugin-astro'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.astro', '.playwright-cli', 'dist', 'dist-astro'] },
  ...astro.configs.recommended,
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // ESLint 10 and react-hooks 7 added these checks after the M0 baseline.
      // Keep them visible during the migration without turning legacy findings
      // into unrelated M1 blockers.
      'preserve-caught-error': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
