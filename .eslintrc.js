module.exports = {
  root: true,
  extends: [
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
  overrides: [
    {
      files: ['*.js', '*.cjs'],
      env: {
        node: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['public/sw.js'],
      env: {
        serviceworker: true,
        browser: true
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    },
    {
      files: ['src/index.css'],
      rules: {
        'at-rule-no-unknown': 'off'
      }
    }
  ]
};