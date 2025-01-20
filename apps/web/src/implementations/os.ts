/* eslint-disable no-unused-vars */
import type { IOperatingSystem } from '@core/interfaces/IOperatingSystem';

export default {
  arch: () => '',
  networkInterfaces: () => ({
    en0: [],
  }),
  process: {
    exec: (command: string) =>
      Promise.resolve({
        stderr: '',
        stdout: '',
      }),
    execFile: (file: string, args?: string[]) =>
      Promise.resolve({
        stderr: '',
      }),
    execSync: (command: string) => {},
  },
  release: () => '',
  type: () => '',
} as IOperatingSystem;
