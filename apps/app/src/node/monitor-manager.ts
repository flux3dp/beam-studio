/* eslint-disable no-unused-vars */
import { exec, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import sudo from 'sudo-prompt';

class MonitorManager {
  private backendLocation: string;

  constructor(options: { location: string }) {
    this.backendLocation = path.join(options.location, '../..');
  }

  killProcSync = () => {
    if (process.platform === 'darwin') {
      try {
        execSync('pkill monitorexe');
      } catch (e) {
        // console.log(e);
      }
    } else if (process.platform === 'win32' && process.arch === 'x64') {
      try {
        execSync('taskkill /F /IM cygserver.exe');
      } catch (e) {
        // console.log(e);
      }
      try {
        execSync('taskkill /F /IM monitorexe.exe');
      } catch (e) {
        // console.log(e);
      }
    }
  };

  killProc = () => {
    if (process.platform === 'darwin') {
      exec('pkill monitorexe', (err, data) => {
        if (err) {
          console.log('kill monitorexe err:', err);
        } else {
          console.log('kill monitorexe succeed');
        }
      });
    } else if (process.platform === 'win32' && process.arch === 'x64') {
      exec('taskkill /F /IM cygserver.exe', (err, data) => {
        if (err) {
          console.log('kill cygserver err:', err);
        } else {
          console.log('kill cygserver succeed');
        }
      });
      exec('taskkill /F /IM monitorexe.exe', (err, data) => {
        if (err) {
          console.log('kill monitorexe err:', err);
        } else {
          console.log('kill monitorexe succeed');
        }
      });
    }
  };

  startProc = () => {
    let monitorCmd = null;
    let execFail = false;
    const sudoOption = {
      icns: 'public/icon.png',
      name: 'Beam Studio',
    };

    if (process.platform === 'darwin') {
      monitorCmd = `"${path.join(this.backendLocation, 'monitorexe-osx/monitorexe')}"`;
    } else if (process.platform === 'win32' && process.arch === 'x64') {
      monitorCmd = `"${path.join(this.backendLocation, 'monitorexe-win64/monitorexe.exe')}"`;
      exec(
        `"${path.join(this.backendLocation, 'monitorexe-win64/cygserver.exe')}"`,
        (err, stdout) => {
          if (err) {
            console.log(err);
          }

          console.log(stdout);
        },
      );

      if (!fs.existsSync(path.join(this.backendLocation, 'tmp'))) {
        fs.mkdirSync(path.join(this.backendLocation, 'tmp'));
      }

      if (!fs.existsSync(path.join(this.backendLocation, 'var'))) {
        fs.mkdirSync(path.join(this.backendLocation, 'var'));
      }
    }

    if (monitorCmd) {
      // Try without sudo-prompt first
      exec(monitorCmd, (err, data) => {
        if (err) {
          console.log('monitorexe err:', err);
          execFail = true;
        } else {
          console.log('monitorexe data:');
          console.log(data);
        }
      });

      if (execFail) {
        sudo.exec(monitorCmd, sudoOption, (err, stdout, stderr) => {
          if (err) {
            console.log('sudo monitorexe err:', err);
          }

          console.log('sudo monitor out:');
          console.log(stdout);
        });
      }
    }
  };
}

export default MonitorManager;
