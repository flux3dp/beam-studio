import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true, // This enables Vitest's Jest-compatible APIs globally
    environment: 'jsdom',
    include: ['**/?(*.)+(spec|test).(ts|tsx)'],
    setupFiles: ['./src/web/setupTests.ts', 'jest-canvas-mock'],
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../coverage/packages/core',
    },
  },
  resolve: {
    alias: {
      '\\.(css|sass|scss)$': 'identity-obj-proxy',
      '\\.svg$': resolve(__dirname, 'src/__mocks__/@core/svgrMock.ts'),
      '\\.svg\\?url$': resolve(__dirname, 'src/__mocks__/@core/urlMock.ts'),
      '^@core/implementations/(.*)$': resolve(__dirname, 'src/implementations/$1'),
      '^@core/(.*)$': resolve(__dirname, 'src/web/$1'),
      '^@mocks/(.*)$': resolve(__dirname, 'src/__mocks__/$1'),
    },
  },
});
