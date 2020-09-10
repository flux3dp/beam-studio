/**
 * API control
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-control
 */
import $ from 'jquery'
import * as i18n from '../i18n'
import Websocket from '../websocket'
import DeviceConstants from '../../app/constants/device-constants'
import rsaKey from '../rsa-key'
import Alert from '../../app/contexts/AlertCaller'
import AlertConstants from '../../app/constants/alert-constants'
import ProgressActions from '../../app/actions/progress-actions'

const CONNECTION_TIMEOUT = 12 * 1000;
const CONNECITON_TIMEOUT_ERROR = {
    'status': 'error',
    'error': 'TIMEOUT',
    'info': 'connection timeoout'
};
const lang = i18n.lang;
class Control {
    public isConnected = false;
    private ws: any | null;
    private dedicatedWs: any[] = [];
    private fileInfoWsId: number = 0;
    private mode: string = ''; // null, maintain or raw
    // todo: remove this??
    private commandCallback = {
        onMessage: (event: any) => {},
        onDebug: (event: any) => {},
        onFatal: (event: any) => {},
        onError: (event: any) => {}
    };
    protected uuid: string;

    constructor(uuid: string) {
        this.uuid = uuid;
    }

    get connection() {
        return this.ws;
    }

    async connect() {
        // possible error
        /*if(response.error === 'REMOTE_IDENTIFY_ERROR') {
        else if(response.error === 'UNKNOWN_DEVICE') {
        else if(response.error === 'NOT_FOUND' || response.error === 'DISCONNECTED') {
        else if(response.code === 1006) message: lang.message.cant_connect_to_device
                        opts.onFatal(response);*/
        
        this.ws = await this.createWs(this.uuid);
    }

    useDefaultResponse (command, timeout=30000) {
        let d = $.Deferred();

        const timeoutTimer = setTimeout(() => {
            d.reject({
                status: 'error',
                text:'TIMEOUT',
                error: 'TIMEOUT',
            });
        }, timeout);

        this.commandCallback.onMessage = (response) => {
            clearTimeout(timeoutTimer);
            d.resolve(response);
        };
        this.commandCallback.onError = (response) => {
            clearTimeout(timeoutTimer);
            d.reject(response);
        };
        this.commandCallback.onFatal = (response) => {
            clearTimeout(timeoutTimer);
            d.reject(response);
        };

        this.ws.send(command);
        return d.promise();
    };

    async createWs (uuid, dedicated: boolean = false) {
        let timeoutTimer;
        let url = uuid;
        const commandCallback = this.commandCallback;
        let newSocket;
        await new Promise((resolve, reject) => {
            newSocket = Websocket({
                method: `control/${url}`,
                onMessage: (data) => {
                    switch (data.status) {
                    case 'connecting':
                        clearTimeout(timeoutTimer);
                        timeoutTimer = setTimeout(() => {
                            reject(CONNECITON_TIMEOUT_ERROR)
                        }, CONNECTION_TIMEOUT);
                        break;
                    case 'connected':
                        clearTimeout(timeoutTimer);
                        if (!dedicated) {
                            this.createDedicatedWs(this.fileInfoWsId);
                        }
                        // TODO: add interface to connected data
                        resolve(data);
                        break;
                    default:
                        this.isConnected = true;
                        this.commandCallback.onMessage(data);
                        break;
                    }
                },
                onDebug: (response) => {
                    if(this.commandCallback.onDebug) {
                        this.commandCallback.onDebug(response);
                    }
                },
                onError: (response) => {
                    clearTimeout(timeoutTimer);
                    // TODO: add interface to response data
                    this.commandCallback.onError(response);
                },
                onFatal: (response) => {
                    clearTimeout(timeoutTimer);
                    reject(response);
                    // TODO: add interface to response data
                    this.commandCallback.onError(response);
                },
                onClose: (response) => {
                    clearTimeout(timeoutTimer);
                    this.isConnected = false;
                    // TODO: add interface to response data
                    reject(response);
                },
                onOpen() {
                    newSocket.send(rsaKey());
                },
                autoReconnect: false
            });
        });
        return newSocket;
    }

        // id is int
        createDedicatedWs (id) {
            if(!this.dedicatedWs[id]) {
                this.dedicatedWs[id] = this.createWs(this.uuid, true);
            }
            return this.dedicatedWs[id];
        }

        prepareUpload (d, data) {
            const CHUNK_PKG_SIZE = 4096;
            let length = data.length || data.size,
                step = 0;

            this.commandCallback.onMessage = (response) => {
                if ('continue' === response.status) {
                    for (let i = 0; i < length; i += CHUNK_PKG_SIZE) {
                        let chunk = data.slice(i, i + CHUNK_PKG_SIZE);
                        step++;
                        this.ws.send(chunk);
                    }
                }
                else if (response.status === 'uploading') {
                    d.notify({step: response.sent, total: data.size});
                }
                else if (response.status === 'ok') {
                    d.resolve();
                }
                else if(response.status === 'error') {
                    d.reject(response);
                }
            };

            this.commandCallback.onError = (response) => { d.reject(response); };
            this.commandCallback.onFatal = (response) => { d.reject(response); };
        }

    
        ls (path) {
            let d = $.Deferred();
            this.commandCallback.onMessage = (response) => {
                switch (response.status) {
                    case 'ok':
                        d.resolve(response);
                        break;
                    case 'connected':
                    default:
                        break;
                }
            };

            this.commandCallback.onError = (response) => { d.reject(response); };
            this.commandCallback.onFatal = (response) => { d.reject(response); };

            this.ws.send(`file ls ${path}`);
            return d.promise();
        }

        lsusb () { return this.useDefaultResponse('file lsusb'); }

        fileInfo (path, fileName) {
                let d = $.Deferred(),
                    data = [],
                    _ws;

                data.push(fileName);
                _ws = this.createDedicatedWs(this.fileInfoWsId);

                this.commandCallback.onMessage = (response) => {
                    data.push(response);
                    if(response.status === 'ok') {
                        d.resolve(data);
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); };

                this.ws.send(`file fileinfo ${path}/${fileName}`);
                return d.promise();
            }

            report () {
                let d = $.Deferred(),
                    counter = 0;

                this.commandCallback.onMessage = (response) => {
                    if(response.status === 'ok') {
                        counter = 0;
                        d.resolve(response);
                    }
                    else {
                        // 3 consecutive error should alert restart machine
                        if(counter >= 3) {
                            d.reject(response);
                        }
                        else {
                            counter++;
                            console.log('retry report');
                            this.ws.send('play report');
                        }
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); };

                setTimeout(function() { d.reject( {status: "Timeout"} )}, 3000);
                this.ws.send('play report');
                return d.promise();
            }

            // upload: function(filesize, print_data) {
            upload (data, path, fileName) {
                let d = $.Deferred();

                this.prepareUpload(d, data);

                if(path && fileName) {
                    fileName = fileName.replace(/ /g, '_');
                    let ext = fileName.split('.');
                    if(ext[ext.length - 1] === 'fc') {
                        this.ws.send(`upload application/fcode ${data.size} ${path}/${fileName}`);
                    }
                    else if(ext[ext.length - 1] === 'gcode') {
                        fileName = fileName.split('.');
                        fileName.pop();
                        fileName.push('fc');
                        fileName = fileName.join('.');
                        this.ws.send(`upload text/gcode ${data.size} ${path}/${fileName}`);
                    }
                }
                else {
                    this.ws.send(`file upload application/fcode ${data.size}`);
                }
                return d.promise();
            }

            abort() {
                let d = $.Deferred(),
                    counter = 0;

                const retryLength = 2000;

                const isAborted = (response) => {
                    response.device_status = response.device_status || {};
                    return response.device_status.st_id === 128 || response.device_status === 0;
                };

                const retry = (needsQuit: boolean = false) => {
                    counter++;
                    setTimeout(() => {
                        needsQuit ? this.ws.send('play abort') : this.ws.send('play report');
                    }, retryLength);
                };

                this.commandCallback.onMessage = (response) => {
                    if(counter >= 3) {
                        console.log('tried 3 times');
                        if(response.cmd === 'play report') {
                            switch(response.device_status.st_id) {
                                case 0:
                                    d.resolve();
                                    break;
                                case 64:
                                    this.ws.send('play quit');
                                    break;
                            }
                        }

                        d.reject(response);
                    }
                    isAborted(response) ? d.resolve() : retry(response.status !== 'ok');
                };
                this.commandCallback.onError = (response) => { counter >= 3 ? d.reject(response) : retry(); };
                this.commandCallback.onFatal = (response) => { counter >= 3 ? d.reject(response) : retry(); };

                this.ws.send('play abort');
                return d.promise();
            };

            start() { return this.useDefaultResponse('play start'); };

            pause() { return this.useDefaultResponse('play pause'); };

            resume() { return this.useDefaultResponse('play resume'); };

            kick() { return this.useDefaultResponse('kick'); };

            quitTask() {
                this.mode = '';
                return this.useDefaultResponse('task quit');
            }

            quit() {
                let d = $.Deferred(),
                    counter = 0;

                const retryLength = 2000;

                const isIdle = (response) => {
                    response.device_status = response.device_status || {};
                    return response.device_status.st_id === 0;
                };

                const retry = (needsQuit: boolean = false) => {
                    counter++;
                    setTimeout(() => {
                        needsQuit ? this.ws.send('play quit') : this.ws.send('play report');
                    }, retryLength);
                };

                this.commandCallback.onMessage = (response) => { isIdle(response) ? d.resolve() : retry(response.status !== 'ok'); };
                this.commandCallback.onError = (response) => { counter >= 3 ? d.reject(response) : retry(); };
                this.commandCallback.onFatal = (response) => { counter >= 3 ? d.reject(response) : retry(); };

                this.ws.send('play quit');
                return d.promise();
            }

            async killSelf() {
                this.dedicatedWs[this.fileInfoWsId].send('kick');
                this.dedicatedWs[this.fileInfoWsId].close();
                this.ws.send('kick');
                this.ws.close();
                await new Promise(r => setTimeout(r, 500));
            }

            deviceInfo() { return this.useDefaultResponse('deviceinfo'); }

            getPreview() {
                let d       = $.Deferred(),
                    data    = [];

                this.commandCallback.onMessage = (response) => {
                    if(response.status === 'ok') {
                        data.push(response);
                        d.resolve(data);
                    }
                    else {
                        data.push(response);
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.resolve(response); };

                this.ws.send('play info');
                return d.promise();
            }

            select (path, fileName) {
                return this.useDefaultResponse(fileName === '' ? `play select ${path.join('/')}` : `play select ${path}/${fileName}`);
            }

            deleteFile (fileNameWithPath) {
                return this.useDefaultResponse(`file rmfile ${fileNameWithPath}`);
            }

            downloadFile (fileNameWithPath) {
                let d = $.Deferred(),
                    file = [];

                this.commandCallback.onMessage = (response) => {
                    if(response.status === 'continue') {
                        d.notify(response);
                    }
                    else {
                        file.push(response);
                    }

                    if(response instanceof Blob) {
                        d.resolve(file);
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.resolve(response); };

                this.ws.send(`file download ${fileNameWithPath}`);
                return d.promise();
            }

            downloadLog (log) {
                let d = $.Deferred(),
                    file = [];

                this.commandCallback.onMessage = (response) => {
                    if(response.status === 'transfer') {
                        d.notify(response);
                    }
                    else if (!~Object.keys(response).indexOf('completed')) {
                        file.push(response);
                    }

                    if(response instanceof Blob) {
                        d.resolve(file);
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.resolve(response); };

                this.ws.send(`fetch_log ${log}`);
                return d;
            }

            downloadErrorLog() {
                let d = $.Deferred(),
                    file = [];

                this.commandCallback.onMessage = (response) => {
                    if(!~Object.keys(response).indexOf('completed')) {
                        file.push(response);
                    }

                    if(response instanceof Blob) {
                        d.resolve(file);
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.resolve(response); };

                this.ws.send('fetch_log fluxcloudd.log');
                return d.promise();
            }

            getLaserPower() {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send('play get_laser_power');
                return d.promise();
            }

            getLaserSpeed() {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send('play get_laser_speed');
                return d.promise();
            }

            getFan() {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send('play get_fan');
                return d.promise();
            }

            setLaserPower (power) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_laser_power ${power}`);
                return d.promise();
            }

            setLaserPowerTemp (power) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_laser_power_temp ${power}`);
                return d.promise();
            }

            setLaserSpeed (speed) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_laser_speed ${speed}`);
                return d.promise();
            }

            setLaserSpeedTemp (speed) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_laser_speed_temp ${speed}`);
                return d.promise();
            }

            setFan (fan) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_fan ${fan}`);
                return d.promise();
            }

            setFanTemp(fan) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_fan_temp ${fan}`);
                return d.promise();
            }

            setOriginX(x) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_origin_x ${x}`);
                return d.promise();
            }

            setOriginY(y) {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); console.log('on error', response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                this.ws.send(`play set_origin_y ${y}`);
                return d.promise();
            }

            getHeadInfo() {
                return this.useDefaultResponse('maintain headinfo');
            }

            getDeviceSetting (name) {
                return this.useDefaultResponse(`config get ${name}`);
            }

            setDeviceSetting (name, value) {
                return this.useDefaultResponse(`config set ${name} ${value}`);
            }

            deleteDeviceSetting (name) {
                return this.useDefaultResponse(`config del ${name}`);
            }

            /**
             * enter maintain mode
             * @param {Int} timeout - timeout (ms)
             *
             * @return {Promise}
             */
            enterMaintainMode() {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => { setTimeout(() => {
                    this.mode = 'maintain';
                    d.resolve(response);
                }, 3000); };
                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); };

                this.ws.send('task maintain');
                return d.promise();
            }

            showOutline (object_height, positions) {
                let frames = '';
                positions.forEach(function(position) {
                let frame = [position.first,
                                position.second,
                                position.third,
                                position.fourth];
                frames += JSON.stringify(frame) + ' ';
                });

                return this.useDefaultResponse(`laser show_outline ${object_height} ${frames}`);
            }

            maintainMove (args: any) {
                var command = '';
                args.f = args.f || '6000';
                command += ' f:' + args.f;
                if (typeof args.x !== 'undefined') {
                    command += ' x:' + args.x;
                };
                if (typeof args.y !== 'undefined') {
                    command += ' y:' + args.y;
                };
                if (typeof args.z !== 'undefined') {
                    command += ' z:' + args.z;
                };
                return this.useDefaultResponse(`maintain move${command}`);
            }

            maintainCloseFan() {
                return this.useDefaultResponse('maintain close_fan');
            }

            endMaintainMode() {
                this.mode = '';
                return this.useDefaultResponse('task quit');
            }

            rawHome() {
                let d = $.Deferred();
                let isCmdResent = false;
                this.commandCallback.onMessage = (response) => {
                    if (response.status === 'raw' && response.text.startsWith('ok')) {
                        d.resolve(response);
                    } else if (response.text.indexOf('ER:RESET') >= 0) {
                        d.reject(response);
                    } else if (response.text.indexOf('error:') >= 0) {
                        // Resend command for error code
                        const errorCode = parseInt(response.text.substring(6));
                        switch (errorCode) {
                            default:
                                if (!isCmdResent) {
                                    isCmdResent = true;
                                    setTimeout(() => {
                                        isCmdResent = false;
                                        this.ws.send('raw home');
                                    }, 200);
                                }
                        }
                    }
                };
                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); };
                this.ws.send('raw home');
                return d.promise();
            }

            rawMove (args) {
                let command = 'G1';
                args.f = args.f || '6000';
                command += 'F' + args.f;
                if (typeof args.x !== 'undefined') {
                    command += 'X' +  Math.round(args.x * 1000) / 1000;
                };
                if (typeof args.y !== 'undefined') {
                    command += 'Y' + Math.round(args.y * 1000) / 1000;
                };
                console.log('raw move command:', command);
                return this.useDefaultResponse(command);
            }

            rawSetRotary (on) {
                const command = on ? 'R1\n' : 'R0\n';
                return this.useDefaultResponse(command);
            }

            enterRawMode() {
                let d = $.Deferred();

                this.commandCallback.onMessage = (response) => { setTimeout(() => {
                    this.mode = 'raw';
                    d.resolve(response);
                }, 3000); };
                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); };

                this.ws.send('task raw');
                return d.promise();
            }

            endRawMode() {
                this.mode = '';
                return this.useDefaultResponse('task quit');
            }

            startToolheadOperation() {
                return this.useDefaultResponse('play toolhead operation');
            }

            endToolheadOperation() {
                return this.useDefaultResponse('play toolhead standby');
            }

            endLoadingDuringPause() {
                return this.useDefaultResponse('play press_button');
            }

            setHeadTemperatureDuringPause(temperature) {
                return this.useDefaultResponse(`play toolhead heater 0 ${temperature}`);
            }

            /**
             * maintain home
             *
             * @return {Promise}
             */
            maintainHome() {
                return this.useDefaultResponse('maintain home');
            }

            /**
             * update firmware
             * @param {File} file - file
             */
            fwUpdate(file) {
                let d = $.Deferred(),
                    blob = new Blob([file], { type: 'binary/flux-firmware' });

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                    case 'ok':
                        d.resolve(response);
                        break;
                    case 'continue':
                        d.notify(response);
                        this.ws.send(blob);
                        break;
                    case 'uploading':
                        response.percentage = (response.sent || 0) / blob.size * 100;
                        d.notify(response);
                        break;
                    default:
                        d.reject(response);
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); };

                this.ws.send(`update_fw binary/flux-firmware ${blob.size}`);

                return d.promise();
            }

            /**
             * update toolhead firmware - device should in `Maintain mode`
             * @param {File} file - file
             */
            toolheadUpdate(file) {
                let d = $.Deferred(),
                    mimeType = 'binary/flux-firmware',
                    blob = new Blob([file], { type: mimeType }),
                    args = [
                        'maintain',
                        'update_hbfw',
                        'binary/fireware',
                        blob.size
                    ];

                this.commandCallback.onMessage = (response) => {
                    switch (response.status) {
                    case 'ok':
                        d.resolve(response);
                        break;
                    case 'continue':
                        d.notify(response);
                        this.ws.send(blob);
                        break;
                    case 'operating':
                    case 'uploading':
                    case 'update_hbfw':
                        response.percentage = (response.written || 0) / blob.size * 100;
                        d.notify(response);
                        break;
                    default:
                        d.reject(response);
                    }
                };

                this.commandCallback.onError = (response) => { d.reject(response); };
                this.commandCallback.onFatal = (response) => { d.reject(response); };

                this.ws.send(args.join(' '));
                return d.promise();
            }
        }
export default Control;