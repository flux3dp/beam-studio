module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: [
    '**/?(*.)+(spec|test).(ts|tsx)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'src/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(svg)$': '<rootDir>/src/__mocks__/svgrMock.ts',
    '^.+\\.(svg)\\?url$': '<rootDir>/src/__mocks__/urlMock.ts',
    "^.+.css$": 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/web/setupTests.ts',
    '!src/web/app/svgedit/**',
    '!src/web/app/actions/beambox/svg-editor.ts',
    '!src/web/app/lang/**',
    '!src/implementations/**',
    '!src/web/app/constants/**',
    '!src/web/helpers/potrace/**',
    // TODO: write unit test for symbol-maker and remove below line
    '!src/web/helpers/symbol-maker.ts',
    // FIXME: Failed to collect coverage from dialog-caller currently
    '!src/web/app/actions/dialog-caller.tsx',
    '!src/**/*.worker.ts',
  ],
  globalSetup: './jest.global-setup.js',
  setupFilesAfterEnv: ['./src/web/setupTests.ts', 'jest-canvas-mock'],
  moduleDirectories: ['node_modules', 'src/web', 'src'],
  coverageReporters: ['text-summary', 'html'],
  maxWorkers: '50%',
}
