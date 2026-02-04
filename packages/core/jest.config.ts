export default {
  displayName: 'core',
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(spec|test).(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'packages/core/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(svg)$': '<rootDir>/src/__mocks__/@core/svgrMock.ts',
    '^.+\\.(svg)\\?url$': '<rootDir>/src/__mocks__/@core/urlMock.ts',
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
