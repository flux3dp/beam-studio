'use strict';

// Warning: Do not include any electron module here
// Warning: Do not include any electron module here
// Warning: Do not include any electron module here

const app = require('electron').app;
const path = require('path');
const EventEmitter = require('events');
const WebSocket = require('ws');
const spawn = require('child_process').spawn;
const appHtmlPath = path.join(app.getAppPath(), 'public').replace('app.asar', 'app.asar.unpacked');


function uglyJsonParser(data) {
    try {
        return JSON.parse(data);
    } catch(err) {
        console.log(data);
        if(err.name === 'SyntaxError') {
            let offset = Number(err.message.split(' ').reverse()[0]);
            if(offset && data.substr(offset, 3) === 'NaN') {
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
        if(options.server) {
            this._args = ['--ip', '0.0.0.0'];
            this._args = this._args.concat(['--port', '8000']);
            this._args = this._args.concat(['--assets', path.join(app.getAppPath(), 'public')]);
            this._args = this._args.concat(['--allow-foreign']);
        } else {
            this._args = ['--port', '0'];
        }
        if(options.debug) {
            console.log(this._args);
            this._args.push('--debug');
        }

        if(!options.location) { throw 'backend location not given'; }
        this._ghost_location = options.location;

        if(options.trace_pid) {
            this._args = this._args.concat(['--trace-pid', options.trace_pid]);
        }

        if(options.on_ready) {
            this.on('ready', options.on_ready);
        }
        if(options.on_stderr) {
            this.on('stderr', options.on_stderr);
        }
        if(options.on_device_updated) {
            this.on('device_updated', options.on_device_updated);
        }
        if(options.on_stopped) {
            this.on('stopped', options.on_stopped);
        }

        console.log('Backend parameters: ', this._args);
        this._running = false;
        this._proc = undefined;
        this._ws = undefined;
        this._wsconn = undefined;
    }

    _setRecover() {
        if(this._recover_timer) {
            return;
        } else {
            console.log('Backend manager recover set.');
            this._recover_timer = setTimeout(() => {
                this._recover_timer = undefined;
                if(this._running) {
                    if(!this._proc) {
                        console.log('Backend manager recover from spawn.');
                        this._spawn();
                    } else if(!this._ws) {
                        console.log('Backend manager recover from websocket.');
                        this._prepare_discover();
                    } else {
                        console.log('Nothing to recover in backend manager');
                    }
                } else {
                    console.log('Backend manager recover ignored.');
                }
            }, 2500);
        }
    }

    _prepare_discover() {
        this._ws = new WebSocket(`ws://127.0.0.1:${this._port}/ws/discover`);
        console.log("Backend start connect!?");
        this._ws.on('open', (conn) => {
            console.log("Backend connection!");
            this._wsconn = conn;
            this._ws_tm = new Date();
            this._ws.on('message', (message) => {

                // prevent timeout disconnect
                let now = new Date();
                if (now - this._ws_tm > 30000) {
                    this._ws.send('ping');
                    this._ws_tm = now;
                }


                let devInfo;

                try {
                    devInfo = uglyJsonParser(message);
                    if (devInfo.status === 'pong') {
                        return
                    }

                } catch(err) {
                    console.error('Can not parse backend stout: %s', err);
                }
                this.emit('device_updated', devInfo);
            });
            this._ws.on('close', () => {
                this._wsconn = undefined;
                this._ws = undefined;
                if(this._running) {
                    console.error('Discover WebSocket close unexpectedly.');
                    this._setRecover();
                }
            });
        });
        this._ws.on('connectFailed', (error) => {
            this._ws = undefined;
            if(this._running) {
                console.error('Discover connect failed: %s', error);
                this._setRecover();
            }
        });
        this._ws.on('error', (error) => {
            console.error('Discover WebSocket error: %s', error);
            this._ws = undefined;
            if(this._running) {
                this._setRecover();
            }
        });
    }

    _spawn() {
        this._proc = spawn('"' + this._ghost_location + '"', this._args, {shell: true});

        this._proc.stdout.on('data', (data) => {
            let result = uglyJsonParser(data.toString());
            if(result && result.type === 'ready') {
                try {
                    this.emit('ready', result);
                } finally {
                    this._port = result.port;
                    this._prepare_discover();
                }
            }
        });

        this._proc.stderr.on('data', (data) => {
            this.emit('stderr', data);
        });

        this._proc.on('exit', () => {
            try {
                this.emit('stopped');
            } finally {
                this._proc = undefined;
                if(this._running) {
                    console.log('Backend terminated unexpectedly!');
                    this._setRecover();
                }
            }
        });
    }

    start() {
        if(!this._running) {
            this._running = true;
            this._spawn();
        }
    }

    stop() {
        if(this._running) {
            this._running = false;
            if (this._proc) {
                this._proc.kill();
            }
        }
    }

    poke(ipaddr) {
        if(this._wsconn !== undefined) {
            console.log('wsconn is', this._wsconn);
            this._wsconn.send(ipaddr);
            return true;
        } else {
            return false;
        }
    }
}

module.exports = BackendManager;
