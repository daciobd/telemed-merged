import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        history: 'readonly',
        URL: 'readonly',
        requestAnimationFrame: 'readonly',
        MutationObserver: 'readonly',
        MSApp: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        Event: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'warn',
      'no-empty': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
    },
  },
  {
    ignores: [
      'dist/**', 
      'node_modules/**', 
      'assets/**',
      'public/**',
      '**/*.e2e.spec.ts', 
      'tests/diretrizes-integration.spec.ts',
      'tests/load/**',
      'tour.js',
      'widget.js',
      'scribe.js',
      '**/*.html',
      '**/*.css'
    ]
  }
];
