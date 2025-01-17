import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

// eslint-disable-next-line import/no-extraneous-dependencies
import { app } from 'electron';

const resourcesRoot = process.defaultApp ? '.' : process.resourcesPath;

function bootstrapMacos() {
  console.log('Bootstrap macos');
  process.env.BACKEND =
    process.env.BACKEND || path.join(resourcesRoot, 'backend', 'flux_api', 'flux_api');
  process.env.BACKEND_ROOT = path.join(resourcesRoot, 'backend');
  console.log(`### backend: ${process.env.BACKEND}`);
}

function bootstrapLinux() {
  console.log('Bootstrap linux');
  bootstrapMacos();
}

function setupWindowsFirewall() {
  try {
    const cmd = path.join(resourcesRoot, 'backend', 'elevate.cmd');
    execSync(
      // eslint-disable-next-line max-len
      `${cmd} netsh advfirewall firewall add rule name="FLUX Discover Port 1901" dir=in action=allow protocol=UDP localport=1901`
    );
  } catch (err) {
    console.log('setup windows firewall error: %s', err);
  }
}

function bootstrapWindows() {
  console.log('Bootstrap windows');
  process.env.BACKEND =
    process.env.BACKEND || path.join(resourcesRoot, 'backend', 'flux_api', 'flux_api.exe');
  process.env.BACKEND_ROOT = path.join(resourcesRoot, 'backend');
  console.log(`### backend: ${process.env.BACKEND}`);

  try {
    execSync('netsh advfirewall firewall show rule name="FLUX Discover Port 1901"');
  } catch (err) {
    setupWindowsFirewall();
  }
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
      throw Error(`System ${os.platform()} not support`);
  }
};

export default bootstrap;
