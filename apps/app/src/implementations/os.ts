import childProcess from 'child_process';
import os from 'os';
import util from 'util';

import type { IOperatingSystem } from '@core/interfaces/IOperatingSystem';

// ref: https://en.wikipedia.org/wiki/Darwin_(operating_system)#Release_history
// list to mac 11 because we support mac 11 and above
export const macKernelVersionMap = {
  '14.5.0': '10.10.5',
  '15.0.0': '10.11.0',
  '15.6.0': '10.11.6',
  '16.0.0': '10.12.0',
  '16.5.0': '10.12.4',
  '16.6.0': '10.12.6',
  '17.0.0': '10.13.0',
  '17.5.0': '10.13.4',
  '17.6.0': '10.13.5',
  '17.7.0': '10.13.6',
  '18.0.0': '10.14.0',
  '18.2.0': '10.14.1',
  '19.0.0': '10.15.0',
  '19.2.0': '10.15.2',
  '19.3.0': '10.15.3',
  '19.5.0': '10.15.5',
  '19.6.0': '10.15.6',
  '20.1.0': '11.0.0',
} as const;

export type MacKernelVersionMap = keyof typeof macKernelVersionMap;

export default {
  arch: os.arch,
  networkInterfaces: os.networkInterfaces,
  process: {
    exec: util.promisify(childProcess.exec),
    execFile: util.promisify(childProcess.execFile),
    execSync: childProcess.execSync,
  },
  release: os.release,
  type: os.type,
} as IOperatingSystem;
