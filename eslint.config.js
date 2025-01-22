'use strict';
const js = require('@eslint/js');
const pluginNx = require('@nx/eslint-plugin');
const style = require('@stylistic/eslint-plugin-js'); // stylistic
const ts = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const format = require('eslint-plugin-format'); // format
const pluginImport = require('eslint-plugin-import-x'); // import
const n = require('eslint-plugin-n');
const perfectionist = require('eslint-plugin-perfectionist'); // strict order elements
const react = require('eslint-plugin-react');
const hooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const unicorn = require('eslint-plugin-unicorn'); // strict style
const unusedImport = require('eslint-plugin-unused-imports');
const globals = require('globals');

const { RULES: perfectionistRules } = require('./eslint/config/perfectionist');
const { RULES: unicornRules } = require('./eslint/config/unicorn');
const { addPrefix, GLOB_STYLE, GLOB_TESTS, GLOB_TS, GLOB_TSX, IGNORES } = require('./eslint/globs');

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
      format,
      hooks,
      import: pluginImport,
      n,
      perfectionist,
      react,
      reactRefresh,
      style,
      ts,
      unicorn,
      unusedImport,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.worker,
        $: true,
        BufferEncoding: true,
        Electron: true,
        NodeJS: true,
      },
      parser: tsParser,
    },
  },
  {
    files: [SRC_GLOB_TS, SRC_GLOB_TSX],
    rules: {
      // js
      ...js.configs.recommended.rules,
      curly: ['error', 'all'],
      'format/prettier': [
        'error',
        {
          parser: 'typescript',
          printWidth: 120,
          semi: true,
          singleQuote: true,
          tabWidth: 2,
        },
      ],
      'hooks/exhaustive-deps': ['warn', { additionalHooks: '(useDrag|useDrop)' }],
      'hooks/rules-of-hooks': 'error',
      // import
      'import/order': [
        'error',
        {
          alphabetize: { caseInsensitive: true, order: 'asc' },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'unknown'],
          'newlines-between': 'always',
          pathGroups: [
            // place react and react-native imports at the top
            {
              group: 'external',
              pattern: 'react+(|-native)',
              position: 'before',
            },
            { group: 'internal', pattern: '@core/**', position: 'before' },
            { group: 'internal', pattern: '@app/**', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
        },
      ],
      // node
      'n/handle-callback-err': ['error', '^(err|error)$'],
      'n/no-deprecated-api': 'error',
      'n/no-exports-assign': 'error',
      'n/no-new-require': 'error',
      'n/no-path-concat': 'error',
      'n/process-exit-as-throw': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // nx
      // enable following rule if our implementations are ready
      // '@nx/enforce-module-boundaries': [
      //   'error',
      //   { allow: [], depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }] },
      // ],
      'react/react-in-jsx-scope': 'off',
      'reactRefresh/only-export-components': ['warn', { allowConstantExport: true }],
      'style/brace-style': ['error', '1tbs'],
      'style/no-extra-semi': 'error',
      'style/padding-line-between-statements': [
        'error',
        { blankLine: 'always', next: 'return', prev: '*' },
        { blankLine: 'always', next: '*', prev: ['const', 'let', 'var'] },
        { blankLine: 'always', next: ['const', 'let', 'var'], prev: '*' },
        {
          blankLine: 'any',
          next: ['const', 'let', 'var'],
          prev: ['const', 'let', 'var'],
        },
        { blankLine: 'always', next: '*', prev: 'if' },
        { blankLine: 'always', next: 'if', prev: '*' },
      ],
      // ts
      'ts/array-type': ['error', { default: 'array-simple', readonly: 'generic' }],
      'ts/consistent-type-imports': 'error',
      'unusedImport/no-unused-imports': 'error',
      ...perfectionistRules,
      ...unicornRules,
    },
  },
  {
    files: ['**/lang/*.ts'],
    rules: {
      'format/prettier': [
        'error',
        {
          parser: 'typescript',
          printWidth: 10000,
          semi: true,
          singleQuote: true,
          tabWidth: 2,
        },
      ],
    },
  },
  {
    files: [SRC_GLOB_STYLE],
    languageOptions: { parser: format.parserPlain },
    rules: { 'format/prettier': ['error', { parser: 'scss', tabWidth: 2 }] },
  },
  {
    files: SRC_GLOB_TESTS,
    languageOptions: { globals: { ...globals.jest } },
  },
  {
    files: ['**/webpack.*.js', 'eslint.config.js', './eslint/**/*.js'],
    rules: {
      'format/prettier': [
        'error',
        {
          parser: 'babel-flow',
          printWidth: 120,
          semi: true,
          singleQuote: true,
          tabWidth: 2,
        },
      ],
      'import/order': [
        'error',
        {
          alphabetize: { caseInsensitive: true, order: 'asc' },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'unknown'],
          'newlines-between': 'always',
          pathGroups: [
            // place react and react-native imports at the top
            {
              group: 'external',
              pattern: 'react+(|-native)',
              position: 'before',
            },
            { group: 'internal', pattern: '@core/**', position: 'before' },
            { group: 'internal', pattern: '@app/**', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
        },
      ],
      'unusedImport/no-unused-imports': 'error',
      ...perfectionistRules,
      ...unicornRules,
    },
  },
];
