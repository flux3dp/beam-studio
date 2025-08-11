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
  '20.2.0': '11.1',
  '20.3.0': '11.2',
  '20.4.0': '11.3',
  '20.5.0': '11.4',
  '20.6.0': '11.5',
  '21.0.0': '12.0 beta 1',
  '21.0.1': '12.0',
  '21.1.0': '12.0.1',
  '21.2.0': '12.1',
  '21.3.0': '12.2',
  '21.4.0': '12.3',
  '21.5.0': '12.4',
  '21.6.0': '12.5',
  '22.0': '13.0 beta 1',
  '22.1.0': '13.0',
  '22.2.0': '13.1',
  '22.3.0': '13.2',
  '22.4.0': '13.3',
  '22.5.0': '13.4',
  '22.6.0': '13.5',
  '23.0.0': '14.0',
  '23.1.0': '14.1',
  '23.2.0': '14.2',
  '23.3.0': '14.3',
  '23.4.0': '14.4',
  '23.5.0': '14.5',
  '24.0.0': '15.0',
  '25.0.0': '26.0', // Thank you Apple
} as const;

export type MacKernelVersionMap = keyof typeof macKernelVersionMap;

const isMacOS15OrLater = (() => {
  try {
    if (os.type() !== 'Darwin') {
      return false;
    }

    const release = os.release();

    return Number.parseInt(release?.split('.')[0] || '0', 10) >= 24;
  } catch (e) {
    console.warn('Failed to determine macOS version:', e);

    return false;
  }
})();

export default {
  arch: os.arch,
  isMacOS15OrLater,
  networkInterfaces: os.networkInterfaces,
  process: {
    exec: util.promisify(childProcess.exec),
    execFile: util.promisify(childProcess.execFile),
    execSync: childProcess.execSync,
  },
  release: os.release,
  type: os.type,
} as IOperatingSystem;
