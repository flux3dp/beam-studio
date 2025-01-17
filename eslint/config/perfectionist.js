/**
 * 1. alphabetical
 * 2. natural
 * 3. line-length
 */
const TYPE = 'natural';

// 1. asc, 2. desc
const ORDER = 'asc';
const DEFAULT_CONFIG = { type: TYPE, order: ORDER };

/**
 * Those commented out rules are much stricter.
 */
const RULES = {
  'perfectionist/sort-array-includes': ['error', DEFAULT_CONFIG],
  'perfectionist/sort-enums': ['error', { ...DEFAULT_CONFIG }],
  'perfectionist/sort-exports': ['error', DEFAULT_CONFIG],
  'perfectionist/sort-interfaces': ['error', { ...DEFAULT_CONFIG }],
  'perfectionist/sort-jsx-props': ['error', DEFAULT_CONFIG],
  'perfectionist/sort-maps': ['error', DEFAULT_CONFIG],
  'perfectionist/sort-named-exports': ['error', DEFAULT_CONFIG],
  'perfectionist/sort-named-imports': ['error', DEFAULT_CONFIG],
  'perfectionist/sort-object-types': ['error', { ...DEFAULT_CONFIG }],
  'perfectionist/sort-objects': ['error', { ...DEFAULT_CONFIG }],
  'perfectionist/sort-intersection-types': ['error', DEFAULT_CONFIG],
  'perfectionist/sort-union-types': ['error', { ...DEFAULT_CONFIG }],
};

module.exports = {
  TYPE,
  ORDER,
  RULES,
};
