import childProcess from 'child_process';
import os from 'os';
import util from 'util';
import { IOperatingSystem } from 'interfaces/IOperatingSystem';

export default {
  type: os.type,
  arch: os.arch,
  release: os.release,
  networkInterfaces: os.networkInterfaces,
  process: {
    exec: util.promisify(childProcess.exec),
    execFile: util.promisify(childProcess.execFile),
    execSync: childProcess.execSync,
  },
} as IOperatingSystem;
