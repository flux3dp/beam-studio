import os from 'os';
import { IOperatingSystem } from 'interfaces/IOperatingSystem';

export default {
  type: os.type,
  arch: os.arch,
  release: os.release,
  networkInterfaces: os.networkInterfaces,
} as IOperatingSystem;
