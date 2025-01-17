import { IOperatingSystem } from 'core-interfaces/IOperatingSystem';

export default {
  type: () => (''),
  arch: () => (''),
  release: () => (''),
  networkInterfaces: () => ({
    en0: [],
  }),
  process: {
    exec: (command: string) => Promise.resolve({
      stdout: '',
      stderr: '',
    }),
    execFile: (file: string, args?: string[]) => Promise.resolve({
      stderr: '',
    }),
    execSync: (command: string) => { },
  },
} as IOperatingSystem;
