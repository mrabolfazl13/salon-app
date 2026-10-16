// ESLint (eslintrc-style، چون ESLint اینجا v8 است و `--ext` فقط در این حالت کار می‌کند)
// پیش از این هیچ فایل پیکربندی وجود نداشت ⇒ گیت CI با شرط hashFiles بی‌صدا skip می‌شد.
// سیاست: قانون‌های «خطای واقعی» روی error، سلیقه‌ای‌ها روی warn (gate فقط error را می‌شکند).
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results', '*.cjs'],
  rules: {
    // خطاها — این‌ها باگ/ریسک واقعی‌اند و gate را می‌شکنند
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-async-promise-executor': 'error',
    'no-cond-assign': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-dupe-args': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-fallthrough': 'error',
    'no-irregular-whitespace': 'error',
    'no-self-compare': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error',
    // ری‌اکت هوکس: نقض ترتیب/وابستگی = باگ حالت؛ در این کدبیس error نگه داشته می‌شود
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // هشدارها — بدهی شناخته‌شده، فعلاً فقط دیده می‌شوند
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react-refresh/only-export-components': 'warn',
    // idiom `Enum | (string & {})` عمداً در serviceها استفاده شده: autocomplete حفظ
    // می‌شود و هر رشتهٔ جدیدِ سرور هم type-check را نمی‌شکند ⇒ فقط `{}` را آزاد کن
    '@typescript-eslint/ban-types': ['error', { extendDefaults: true, types: { '{}': false } }],
  },
  overrides: [
    {
      // در فایل‌های غیر-کامپوننت، قوانین react-refresh معنایی ندارند
      files: ['*.ts', 'src/services/**/*.ts', 'src/store/**/*.ts', 'src/utils/**/*.ts'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
    {
      files: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*'],
      env: { node: true },
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
  ],
}
