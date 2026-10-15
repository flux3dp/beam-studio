export default {
  displayName: 'core',
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(spec|test).(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'packages/core/tsconfig.spec.json' }],
    '^.+\\.svg$': '<rootDir>/jest.raw-transform.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(svg)$': '<rootDir>/src/__mocks__/@core/svgrMock.ts',
    '^.+\\.(svg)\\?url$': '<rootDir>/src/__mocks__/@core/urlMock.ts',
    // *.svg?raw resolves to the real file; jest.raw-transform.js exports its text
    '^(.+)\\.svg\\?raw$': '$1.svg',
    '^.+.css$': 'identity-obj-proxy',
    '^@core/implementations/(.*)$': '<rootDir>/src/implementations/$1',
    '^@core/(.*)$': '<rootDir>/src/web/$1',
    '^@mocks/(.*)$': '<rootDir>/src/__mocks__/$1',
  },
  globalSetup: './jest.global-setup.ts',
  setupFilesAfterEnv: ['./src/web/setupTests.ts', 'jest-canvas-mock'],
  moduleDirectories: ['node_modules', 'src/web', 'src'],
  coverageDirectory: '../../coverage/packages/core',
};
