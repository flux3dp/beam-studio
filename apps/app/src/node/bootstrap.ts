import os from 'os';
import path from 'path';

import { app } from 'electron';

const resourcesRoot = process.defaultApp ? '.' : process.resourcesPath;

function bootstrapMacos() {
  console.log('Bootstrap macos');
  process.env.BACKEND = process.env.BACKEND || path.join(resourcesRoot, 'backend', 'flux_api', 'flux_api');
  process.env.BACKEND_ROOT = path.join(resourcesRoot, 'backend');
  console.log(`### backend: ${process.env.BACKEND}`);
}

function bootstrapLinux() {
  console.log('Bootstrap linux');
  bootstrapMacos();
}

function bootstrapWindows() {
  console.log('Bootstrap windows');
  process.env.BACKEND = process.env.BACKEND || path.join(resourcesRoot, 'backend', 'flux_api', 'flux_api.exe');
  process.env.BACKEND_ROOT = path.join(resourcesRoot, 'backend');
  console.log(`### backend: ${process.env.BACKEND}`);
}

const bootstrap = (): void => {
  process.env.appVersion = app.getVersion();
  console.log(`### appVersion: ${process.env.appVersion}`);
  switch (os.platform()) {
    case 'darwin':
      bootstrapMacos();
      break;
    case 'freebsd':
    case 'linux':
      bootstrapLinux();
      break;
    case 'win32':
      bootstrapWindows();
      break;
    default:
      throw new Error(`System ${os.platform()} not support`);
  }
};

export default bootstrap;
