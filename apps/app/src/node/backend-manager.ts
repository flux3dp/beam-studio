import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { app, ipcMain } from 'electron';

import { BackendEvents } from '@core/app/constants/ipcEvents';

import { getSwiftrayPaths, killStaleSwiftray, killSwiftrayPid } from './helpers/swiftrayProcess';

/** Consecutive failed starts before we tell the renderer the backend is broken, not just slow. */
const MAX_FAILED_STARTS = 3;

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

  /** Whether we have processes left to clean up, so stop() does not sweep twice. */
  private hasStarted = false;

  /** Whether we spawned Swiftray, i.e. whether the daemon is ours to kill. */
  private hasSpawnedSwiftray = false;

  /** Consecutive backend exits since it last reported ready. */
  private failedStarts = 0;

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
    on_stopped?: (info: { failedToStart: boolean }) => void;
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

    // Nothing to run: anti-virus removed the binary, or the install is broken. Report it at once
    // rather than leaving the renderer waiting for a port that will never arrive. Recovery still
    // retries, so restoring the file heals without a restart.
    if (!fs.existsSync(this.ghostLocation)) {
      console.error(`Backend not found at ${this.ghostLocation}`);
      this.emit('stopped', { failedToStart: true });

      if (this.isRunning) this.setRecover();

      return;
    }

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
          this.failedStarts = 0;
        }
      }
    });

    this.proc.stderr?.on('data', (data) => {
      this.emit('stderr', data);
    });

    this.proc.on('exit', () => {
      // A deliberate stop() is not a failure.
      if (this.isRunning) this.failedStarts += 1;

      try {
        // Repeated exits mean the backend cannot stay up: blocked by the OS, or crashing on start.
        // One exit can be a hiccup, and a slow launch does not exit at all, so both keep waiting.
        this.emit('stopped', { failedToStart: this.failedStarts >= MAX_FAILED_STARTS });
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
    const paths = getSwiftrayPaths();

    if (!paths) {
      console.error('checkSwiftrayExists: BACKEND_ROOT not set or unsupported platform');

      return false;
    }

    return fs.existsSync(path.join(paths.dir, paths.exec));
  };

  spawnSwiftray(): void {
    const paths = getSwiftrayPaths();

    if (!paths) {
      console.error('spawnSwiftray: BACKEND_ROOT not set or unsupported platform');

      return;
    }

    // A daemon orphaned by a crash or a force quit still owns the port, which would make the
    // instance we are about to spawn unreachable. Clear the way before every spawn.
    killStaleSwiftray();

    const command = os.platform() === 'win32' ? `"${paths.exec}"` : `./"${paths.exec}"`;

    this.swiftrayProc = spawn(command, ['--daemon'], { cwd: paths.dir, shell: true });
    this.hasSpawnedSwiftray = true;

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

  killSwiftray(): void {
    // Never spawned one: the running daemon belongs to another instance, so leave it alone.
    if (!this.hasSpawnedSwiftray) return;

    const proc = this.swiftrayProc;

    this.hasSpawnedSwiftray = false;
    this.swiftrayProc = undefined;
    // This exit is deliberate: skip the recover timer and the sweep the handler would add to ours.
    proc?.removeAllListeners('exit');

    if (proc?.pid) killSwiftrayPid(proc.pid);

    // `pid` is the shell wrapper, and on Windows a tree kill can miss a re-parented daemon, so
    // always follow up with the name/port sweep.
    killStaleSwiftray();
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.hasStarted = true;
      this.spawn();
    }
  }

  /** Separate from start() so the caller can keep the synchronous orphan sweep off the launch path. */
  startSwiftray(): void {
    if (this.isRunning && !this.swiftrayProc) {
      this.spawnSwiftray();
    }
  }

  stop(): void {
    // Quitting can reach here twice (window close, then will-quit); one sweep is enough.
    if (!this.hasStarted) return;

    this.hasStarted = false;

    if (this.recoverTimerSwiftray) {
      clearTimeout(this.recoverTimerSwiftray);
      this.recoverTimerSwiftray = undefined;
    }

    if (this.recoverTimer) {
      clearTimeout(this.recoverTimer);
      this.recoverTimer = undefined;
    }

    this.isRunning = false;
    this.proc?.kill();
    this.proc = undefined;

    try {
      this.killSwiftray();
    } catch (error) {
      console.error('Failed to kill Swiftray:', error);
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
