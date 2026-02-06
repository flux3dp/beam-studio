import type { ChildProcess } from 'child_process';
import { execSync, spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { app, ipcMain } from 'electron';
// @ts-expect-error Missing type definitions
import type WebSocket from 'ws';

import { BackendEvents } from '@core/app/constants/ipcEvents';

function uglyJsonParser(data: string): any {
  try {
    return JSON.parse(data);
  } catch (err) {
    const error = err as Error;

    console.log(data);

    if (error.name === 'SyntaxError') {
      const offset = Number(error.message.split(' ').reverse()[0]);

      if (offset && data.substr(offset, 3) === 'NaN') {
        return uglyJsonParser(`${data.substr(0, offset)}null${data.substr(offset + 3)}`);
      }
    }
  }

  return {};
}

class BackendManager extends EventEmitter {
  private args: string[];

  private ghostLocation: string;

  private isRunning: boolean;

  private port?: number;

  private recoverTimer?: NodeJS.Timeout;

  private recoverTimerSwiftray?: NodeJS.Timeout;

  private proc?: ChildProcess;

  private swiftrayProc?: ChildProcess;

  private ws?: WebSocket;

  private wsConn?: WebSocket;

  private wsTime?: number;

  constructor(options: {
    debug?: boolean;
    location?: string;
    on_ready?: (sender: any) => void;
    on_stderr?: (sender: any, data: any) => void;
    on_stopped?: (sender: any) => void;
    server?: boolean;
    trace_pid?: number;
  }) {
    super();

    if (options.server) {
      this.args = ['--ip', '0.0.0.0'];
      this.args = this.args.concat(['--port', '8000']);
      this.args = this.args.concat(['--assets', path.join(app.getAppPath(), 'public')]);
      this.args = this.args.concat(['--allow-foreign']);
    } else {
      this.args = ['--port', '0'];
    }

    if (options.debug) {
      console.log(this.args);
      this.args.push('--debug');
    }

    if (!options.location) {
      throw new Error('backend location not given');
    }

    this.ghostLocation = options.location;

    if (options.trace_pid) {
      this.args = this.args.concat(['--trace-pid', options.trace_pid.toString()]);
    }

    if (options.on_ready) {
      this.on('ready', options.on_ready);
    }

    if (options.on_stderr) {
      this.on('stderr', options.on_stderr);
    }

    if (options.on_stopped) {
      this.on('stopped', options.on_stopped);
    }

    console.log('Backend parameters: ', this.args);
    this.isRunning = false;
    this.proc = undefined;
    this.ws = undefined;
    this.wsConn = undefined;
    ipcMain.handle(BackendEvents.CheckSwiftray, () => this.checkSwiftrayExists());
  }

  setRecover(): void {
    if (this.recoverTimer) {
      return;
    }

    console.log('Backend manager recover set.');
    this.recoverTimer = setTimeout(() => {
      this.recoverTimer = undefined;

      if (this.isRunning) {
        if (!this.proc) {
          console.log('Backend manager recover from spawn.');
          this.spawn();
        } else if (!this.ws) {
          console.log('Backend manager recover from websocket.');
        } else {
          console.log('Nothing to recover in backend manager');
        }
      } else {
        console.log('Backend manager recover ignored.');
      }
    }, 2500);
  }

  setRecoverSwiftray(): void {
    if (this.recoverTimerSwiftray) {
      return;
    }

    console.log('Swiftray recover set.');
    this.recoverTimerSwiftray = setTimeout(() => {
      this.recoverTimerSwiftray = undefined;

      if (this.isRunning) {
        if (!this.swiftrayProc) {
          console.log('Swiftray recover from spawn.');
          this.spawnSwiftray();
        } else {
          console.log('Nothing to recover in swiftray');
        }
      } else {
        console.log('Swiftray recover ignored.');
      }
    }, 2500);
  }

  spawn(): void {
    const ghostDirectoy = path.dirname(this.ghostLocation);
    const ghostExec = path.basename(this.ghostLocation);

    if (os.platform() === 'win32') {
      this.proc = spawn(`"${ghostExec}"`, this.args, { cwd: ghostDirectoy, shell: true });
    } else {
      this.proc = spawn(`./"${ghostExec}"`, this.args, { cwd: ghostDirectoy, shell: true });
    }

    this.proc.stdout?.on('data', (data) => {
      const result = uglyJsonParser(data.toString());

      if (result && result.type === 'ready') {
        try {
          this.emit('ready', result);
        } finally {
          this.port = result.port;
        }
      }
    });

    this.proc.stderr?.on('data', (data) => {
      this.emit('stderr', data);
    });

    this.proc.on('exit', () => {
      try {
        this.emit('stopped');
      } finally {
        this.proc = undefined;

        if (this.isRunning) {
          console.log('Backend terminated unexpectedly!');
          this.setRecover();
        }
      }
    });
  }

  checkSwiftrayExists = (): boolean => {
    if (!process.env.BACKEND_ROOT) {
      return false;
    }

    let swiftrayDir: string;
    let swiftrayExec: string;

    if (os.platform() === 'win32') {
      swiftrayDir = path.join(process.env.BACKEND_ROOT, 'swiftray');
      swiftrayExec = 'Swiftray.exe';
    } else if (os.platform() === 'darwin') {
      swiftrayDir = path.join(process.env.BACKEND_ROOT, 'Swiftray.app', 'Contents', 'MacOS');
      swiftrayExec = 'Swiftray';
    } else {
      console.error('checkSwiftrayExists: Unsupported platform');

      return false;
    }

    return fs.existsSync(path.join(swiftrayDir, swiftrayExec));
  };

  spawnSwiftray(): void {
    if (!process.env.BACKEND_ROOT) {
      console.error('spawnSwiftray: BACKEND_ROOT not set');

      return;
    }

    let swiftrayDir: string;
    let swiftrayExec: string;

    if (os.platform() === 'win32') {
      swiftrayDir = path.join(process.env.BACKEND_ROOT, 'swiftray');
      swiftrayExec = 'Swiftray.exe';
      this.swiftrayProc = spawn(`"${swiftrayExec}"`, ['--daemon'], {
        cwd: swiftrayDir,
        shell: true,
      });
    } else if (os.platform() === 'darwin') {
      swiftrayDir = path.join(process.env.BACKEND_ROOT, 'Swiftray.app', 'Contents', 'MacOS');
      swiftrayExec = 'Swiftray';
      this.swiftrayProc = spawn(`./"${swiftrayExec}"`, ['--daemon'], {
        cwd: swiftrayDir,
        shell: true,
      });
    } else {
      console.error('spawnSwiftray: Unsupported platform');
    }

    if (this.swiftrayProc) {
      this.swiftrayProc.stdout?.on('data', (data) => {
        console.log(`Swiftray: ${data}`);
      });
      this.swiftrayProc.stderr?.on('data', (data) => {
        console.error(`Swiftray: ${data}`);
      });
      this.swiftrayProc.on('exit', () => {
        console.error('Swiftray terminated unexpectedly!');
        this.swiftrayProc = undefined;

        if (this.isRunning) {
          this.setRecoverSwiftray();
        }
      });
    }
  }

  killSwiftray(): void {
    if (this.swiftrayProc) {
      if (os.platform() === 'win32' && this.swiftrayProc.pid) {
        console.log(this.swiftrayProc.pid);

        const res = execSync(`taskkill /PID ${this.swiftrayProc.pid} /T /F`);

        console.log(res.toString());
      } else {
        this.swiftrayProc.kill();
      }
    }
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.spawn();
      this.spawnSwiftray();
    }
  }

  stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.proc?.kill();
      this.killSwiftray();
    }
  }

  poke(ipaddr: string): boolean {
    if (this.wsConn !== undefined) {
      console.log('wsconn is', this.wsConn);
      this.wsConn.send(ipaddr);

      return true;
    }

    return false;
  }
}

export default BackendManager;
