'use strict';
const globals = require('globals');
const pluginNx = require('@nx/eslint-plugin');
const js = require('@eslint/js');
const ts = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const n = require('eslint-plugin-n');
// import
const pluginImport = require('eslint-plugin-import-x');
const unusedImport = require('eslint-plugin-unused-imports');
// react
const react = require('eslint-plugin-react');
const hooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
// strict style
const style = require('@stylistic/eslint-plugin-js');
const perfectionist = require('eslint-plugin-perfectionist');
const unicorn = require('eslint-plugin-unicorn');
// format
const format = require('eslint-plugin-format');

const { RULES: perfectionistRules } = require('./eslint/config/perfectionist');
const { RULES: unicornRules } = require('./eslint/config/unicorn');
const { addPrefix, IGNORES, GLOB_TS, GLOB_TSX, GLOB_STYLE, GLOB_TESTS } = require('./eslint/globs');

const SRC_GLOB_TS = addPrefix('**/src', GLOB_TS);
const SRC_GLOB_TSX = addPrefix('**/src', GLOB_TSX);
const SRC_GLOB_STYLE = addPrefix('**/src', GLOB_STYLE);
const SRC_GLOB_TESTS = addPrefix('**/src', GLOB_TESTS);

module.exports = [
  {
    ignores: IGNORES,
  },
  {
    plugins: {
      '@nx': pluginNx,
      ts,
      n,
      import: pluginImport,
      unusedImport,
      react,
      hooks,
      reactRefresh,
      style,
      unicorn,
      perfectionist,
      format,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.worker,
        NodeJS: true,
        BufferEncoding: true,
        $: true,
        Electron: true,
      },
      parser: tsParser,
    },
  },
  {
    files: [SRC_GLOB_TS, SRC_GLOB_TSX],
    rules: {
      // js
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // ts
      'ts/array-type': ['error', { default: 'array-simple', readonly: 'generic' }],
      'ts/consistent-type-imports': 'error',
      // import
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'unknown'],
          pathGroups: [
            // place react and react-native imports at the top
            { pattern: 'react+(|-native)', group: 'external', position: 'before' },
            { pattern: '@core/**', group: 'internal', position: 'before' },
            { pattern: '@app/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
        },
      ],
      'unusedImport/no-unused-imports': 'error',
      // node
      'n/handle-callback-err': ['error', '^(err|error)$'],
      'n/no-deprecated-api': 'error',
      'n/no-exports-assign': 'error',
      'n/no-new-require': 'error',
      'n/no-path-concat': 'error',
      'n/process-exit-as-throw': 'error',
      // nx
      // enable following rule if our implementations are ready
      // '@nx/enforce-module-boundaries': [
      //   'error',
      //   { allow: [], depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }] },
      // ],
      // react
      'react/react-in-jsx-scope': 'off',
      'hooks/rules-of-hooks': 'error',
      'hooks/exhaustive-deps': ['warn', { additionalHooks: '(useDrag|useDrop)' }],
      'reactRefresh/only-export-components': ['warn', { allowConstantExport: true }],
      // style
      curly: ['error', 'all'],
      'style/brace-style': ['error', '1tbs'],
      'style/no-extra-semi': 'error',
      'style/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['const', 'let', 'var'] },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: '*', next: 'if' },
      ],
      'style/quotes': ['error', 'single'],
      'format/prettier': [
        'error',
        {
          parser: 'typescript',
          singleQuote: true,
          tabWidth: 2,
          semi: true,
          printWidth: 100,
          overrides: [
            {
              files: '**/lang/*.ts',
              options: {
                printWidth: 10000,
              },
            },
          ],
        },
      ],
      ...perfectionistRules,
      ...unicornRules,
    },
  },
  {
    files: [SRC_GLOB_STYLE],
    languageOptions: {
      parser: format.parserPlain,
    },
    rules: {
      'format/prettier': ['error', { parser: 'scss', tabWidth: 2 }],
    },
  },
  {
    files: SRC_GLOB_TESTS,
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
