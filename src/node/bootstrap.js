'use strict';

const os = require('os');
const path = require('path');
const { app } = require('electron');
const execSync = require('child_process').execSync;

const resourcesRoot = process.defaultApp ? '.' : process.resourcesPath;

function bootstrap_macos() {
  console.log('Bootstrap macos');
  process.env.BACKEND = process.env.BACKEND || path.join(resourcesRoot, 'backend', 'flux_api', 'flux_api');
  console.log(`### backend: ${process.env.BACKEND}`);
}

function bootstrap_linux() {
  console.log('Bootstrap linux');
  bootstrap_macos();
}

function bootstrap_windows() {
  console.log('Bootstrap windows');
  process.env.BACKEND = process.env.BACKEND || path.join(resourcesRoot, 'backend', 'flux_api', 'flux_api.exe');
  console.log(`### backend: ${process.env.BACKEND}`);

  try {
    execSync('netsh advfirewall firewall show rule name="FLUX Discover Port 1901"');
  } catch (err) {
    setupWindowsFirewall();
  }
}

function setupWindowsFirewall() {
  try {
    const cmd = path.join(resourcesRoot, 'backend', 'elevate.cmd');
    execSync(cmd + ' netsh advfirewall firewall add rule name="FLUX Discover Port 1901" dir=in action=allow protocol=UDP localport=1901');
  } catch (err) {
    console.log('setup windows firewall error: %s', err);
  }
}

process.env.appVersion = app.getVersion();

switch (os.platform()) {
  case 'darwin':
    bootstrap_macos();
    break;
  case 'freebsd':
  case 'linux':
    bootstrap_linux();
    break;
  case 'win32':
    bootstrap_windows();
    break;
  default:
    throw `System ${os.platform()} not support`;
}
