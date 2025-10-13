import js from '@eslint/js';
import globals from 'globals';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      'dist/',
      'build/',
      '.next/',
      'out/',
      'node_modules/',
      '*.config.js',
      '*.config.ts',
      '*.config.cjs',
      '*.config.mjs',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
      'drizzle.config.ts',
      'accounting-drizzle.config.ts',
      'coverage/',
      '.nyc_output/',
      'public/',
      'client/public/',
      '.env*',
      '*.d.ts',
      'logs/',
      '*.log',
      '*.sql',
      '*.dump',
      '.vscode/',
      '.idea/',
      '.DS_Store',
      '*.swp',
      '*.swo',
      '*.min.js',
      '*.min.css',
      '*.bundle.js',
      '*.bundle.css',
      'migrations/',
      'drizzle/',
      'utils/api/',
      'utils/backup/',
      'utils/build/',
      'utils/cleanup/',
      'utils/batch/',
      'utils/migration/',
      'utils/tokens/',
      'utils/verification/',
      'attached_assets/',
      '**/*.test.cjs',
      '**/test-*.js',
      '**/test-*.cjs'
    ]
  },
  js.configs.recommended,
  {
    // Base configuration for all files
    rules: {
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-redeclare': 'off', // Use TypeScript version instead
      'no-case-declarations': 'off', // Allow declarations in case blocks (common pattern)
      'no-useless-escape': 'warn' // Warn instead of error
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // Disable base rule as it can report incorrect errors
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-undef': 'off' // TypeScript handles this
    }
  }
];

