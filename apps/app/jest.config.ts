/**
 * Minimal Jest config for the Electron app (apps/app).
 *
 * Scope: node-side logic under src/node/ (e.g. tabManager). Uses the `node`
 * environment (no jsdom) since this code never touches the DOM. Electron and
 * @electron/remote are always mocked in the specs themselves.
 *
 * This config is intentionally isolated from packages/core's config: it does
 * NOT pull in core's setupTests / jest-canvas-mock / global setup, none of
 * which apply to the node side.
 */
export default {
  displayName: 'app',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'apps/app/tsconfig.jest.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    // App-side implementations resolve to core's stubs (none needed yet, but kept for parity).
    '^@core/implementations/(.*)$': '<rootDir>/../../packages/core/src/implementations/$1',
    '^@core/(.*)$': '<rootDir>/../../packages/core/src/web/$1',
    '^@mocks/(.*)$': '<rootDir>/../../packages/core/src/__mocks__/$1',
  },
  coverageDirectory: '../../coverage/apps/app',
};
