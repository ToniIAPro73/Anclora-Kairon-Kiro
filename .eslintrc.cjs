module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'Panel de tareas inteligente.jsx'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    vi: 'readonly',
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
  },
  rules: {
    // Allow console.log in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // Prefer const assertions
    'prefer-const': 'error',
    // No unused variables
    'no-unused-vars': 'warn',
    // Consistent quotes
    'quotes': ['error', 'single'],
    // Consistent semicolons
    'semi': ['error', 'never'],
  },
}