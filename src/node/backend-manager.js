'use strict';

// Warning: Do not include any electron module here
// Warning: Do not include any electron module here
// Warning: Do not include any electron module here

const app = require('electron').app;
const os = require('os');
const path = require('path');
const EventEmitter = require('events');
const WebSocket = require('ws');
const spawn = require('child_process').spawn;

function uglyJsonParser(data) {
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log(data);
    if (err.name === 'SyntaxError') {
      const offset = Number(err.message.split(' ').reverse()[0]);
      if (offset && data.substr(offset, 3) === 'NaN') {
        return uglyJsonParser(`${data.substr(0, offset)}null${data.substr(offset + 3)}`);
      }
    }
  }
}

class BackendManager extends EventEmitter {
  constructor(options) {
    super();
    // location: exec path
    // trace_pid: optional
    // on_ready: callback, (sender) => {}
    // on_device_updated, callback (sender, deviceProfile) => {}
    // on_stderr: callback, (sender, data) => {}
    // on_stopped: callback, (sender) => {}
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

    if (!options.location) { throw 'backend location not given'; }
    this.ghostLocation = options.location;

    if (options.trace_pid) {
      this.args = this.args.concat(['--trace-pid', options.trace_pid]);
    }

    if (options.on_ready) {
      this.on('ready', options.on_ready);
    }
    if (options.on_stderr) {
      this.on('stderr', options.on_stderr);
    }
    if (options.on_device_updated) {
      this.on('device_updated', options.on_device_updated);
    }
    if (options.on_stopped) {
      this.on('stopped', options.on_stopped);
    }

    console.log('Backend parameters: ', this.args);
    this.isRunning = false;
    this.proc = undefined;
    this.ws = undefined;
    this.wsConn = undefined;
  }

  setRecover() {
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
          this.prepare_discover();
        } else {
          console.log('Nothing to recover in backend manager');
        }
      } else {
        console.log('Backend manager recover ignored.');
      }
    }, 2500);
  }

  prepare_discover() {
    this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/ws/discover`);
    console.log('Backend start connect!?');
    this.ws.on('open', (conn) => {
      console.log('Backend connection!');
      this.wsConn = conn;
      this.wsTime = new Date();
      this.ws.on('message', (message) => {
        // prevent timeout disconnect
        const now = new Date();
        if (now - this.wsTime > 30000) {
          this.ws.send('ping');
          this.wsTime = now;
        }

        let devInfo;

        try {
          devInfo = uglyJsonParser(message);
          if (devInfo.status === 'pong') return;
        } catch (err) {
          console.error('Can not parse backend stout: %s', err);
        }
        this.emit('device_updated', devInfo);
      });
      this.ws.on('close', () => {
        this.wsConn = undefined;
        this.ws = undefined;
        if (this.isRunning) {
          console.error('Discover WebSocket close unexpectedly.');
          this.setRecover();
        }
      });
    });
    this.ws.on('connectFailed', (error) => {
      this.ws = undefined;
      if (this.isRunning) {
        console.error('Discover connect failed: %s', error);
        this.setRecover();
      }
    });
    this.ws.on('error', (error) => {
      console.error('Discover WebSocket error: %s', error);
      this.ws = undefined;
      if (this.isRunning) {
        this.setRecover();
      }
    });
  }

  spawn() {
    const ghostDirectoy = path.dirname(this.ghostLocation);
    const ghostExec = path.basename(this.ghostLocation);
    if (os.platform() === 'win32') this.proc = spawn(`"${ghostExec}"`, this.args, { shell: true, cwd: ghostDirectoy });
    else this.proc = spawn(`./"${ghostExec}"`, this.args, { shell: true, cwd: ghostDirectoy });

    this.proc.stdout.on('data', (data) => {
      const result = uglyJsonParser(data.toString());
      if (result && result.type === 'ready') {
        try {
          this.emit('ready', result);
        } finally {
          this.port = result.port;
          this.prepare_discover();
        }
      }
    });

    this.proc.stderr.on('data', (data) => {
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

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.spawn();
    }
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.proc) {
        this.proc.kill();
      }
    }
  }

  poke(ipaddr) {
    if (this.wsConn !== undefined) {
      console.log('wsconn is', this.wsConn);
      this.wsConn.send(ipaddr);
      return true;
    }
    return false;
  }
}

module.exports = BackendManager;
