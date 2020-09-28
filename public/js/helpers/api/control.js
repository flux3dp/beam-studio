/**
 * API control
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-control
 */
define([
    'jquery',
    'helpers/i18n',
    'helpers/websocket',
    'helpers/convertToTypedArray',
    'app/constants/device-constants',
    'helpers/rsa-key',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants'
], function($, i18n, Websocket, convertToTypedArray, DeviceConstants, rsaKey, Alert, AlertConstants) {
    'use strict';

    return function(uuid, opts) {
        opts = opts || {};
        opts.onError = opts.onError || function() {};
        opts.onConnect = opts.onConnect || function() {};

        let timeout = 12 * 1000,
            timer,
            isLineCheckMode = false,
            currentLineNumber = 1,
            isConnected = false,
            lang = i18n.get(),
            ws,
            dedicatedWs = [],
            fileInfoWsId = 0,
            events = {
                onMessage: () => {},
                onError: opts.onError
            },
            isTimeout = () => {
                let error = {
                    'status': 'error',
                    'error': 'TIMEOUT',
                    'info': 'connection timeoout'
                };
                opts.onError(error);
            };

        const createWs = (wsOptions) => {
            let url = opts.availableUsbChannel >= 0  && opts.availableUsbChannel !==null ? `usb/${opts.availableUsbChannel}` : (uuid.length < 3 ? `usb/${uuid}` : uuid);
            let _ws = new Websocket({
                method: `control/${url}`,
                onMessage: (data) => {
                    switch (data.status) {
                    case 'connecting':
                        opts.onConnect(data);
                        clearTimeout(timer);
                        timer = setTimeout(isTimeout, timeout);
                        break;
                    case 'connected':
                        clearTimeout(timer);
                        createDedicatedWs(fileInfoWsId);
                        opts.onConnect(data, wsOptions);
                        break;
                    default:
                        isConnected = true;
                        events.onMessage(data);
                        break;
                    }
                },
                onDebug: (response) => {
                    if(events.onDebug) {
                        events.onDebug(response);
                    }
                },
                onError: (response) => {
                    clearTimeout(timer);
                    events.onError(response);
                },
                onFatal: (response) => {
                    clearTimeout(timer);
                    if(response.error === 'REMOTE_IDENTIFY_ERROR') {
                        setTimeout(() => {
                            createWs();
                        }, 3 * 1000);
                    }
                    else if(response.error === 'UNKNOWN_DEVICE') {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message: lang.message.unknown_device
                        });
                    }
                    else if(response.error === 'NOT_FOUND' || response.error === 'DISCONNECTED') {
                        opts.onError(response);
                    }
                    else if(response.code === 1006) {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message: lang.message.cant_connect_to_device
                        });
                        opts.onFatal(response);
                    }
                    else {
                        clearTimeout(timer);
                        events.onError(response);
                    }
                },
                onClose: (response) => {
                    clearTimeout(timer);
                    isConnected = false;
                    opts.onFatal(response);
                },
                onOpen: () => {
                    _ws.send(rsaKey());
                },
                autoReconnect: false
            });

            return _ws;
        };

        // id is int
        const createDedicatedWs = (id) => {
            if(!dedicatedWs[id]) {
                dedicatedWs[id] = createWs({dedicated: true});
            }
            return dedicatedWs[id];
        };

        const useDefaultResponse = (command, timeout=30000) => {
            let d = $.Deferred();

            const timeoutTimer = setTimeout(() => {
                d.reject({
                    status: 'error',
                    text:'TIMEOUT',
                    error: 'TIMEOUT',
                });
            }, timeout);

            events.onMessage = (response) => {
                clearTimeout(timeoutTimer);
                d.resolve(response);
            };
            events.onError = (response) => {
                clearTimeout(timeoutTimer);
                d.reject(response);
            };
            events.onFatal = (response) => {
                clearTimeout(timeoutTimer);
                d.reject(response);
            };

            ws.send(command);
            return d.promise();
        };

        const calculateCRC = (command) => {
            let crc = 0;
            for (let i = 0; i < command.length; i++) {
                if (command[i] != ' ') {
                    let charCode = command[i].charCodeAt();
                    crc ^= charCode;
                    crc += charCode;
                }
            }
            crc %= 65536;
            return crc;
        }

        const buildLineCheckCommand = (command) => {
            command = `N${currentLineNumber}${command}`;
            let crc = calculateCRC(command);
            return `${command} *${crc}`;
        }

        const rawLineCheckCommand = (command, timeout=30000) => {
            let d = $.Deferred();

            const timeoutTimer = setTimeout(() => {
                d.reject({
                    status: 'error',
                    text:'TIMEOUT',
                    error: 'TIMEOUT',
                });
            }, timeout);
            
            events.onMessage = (response) => {
                if (response && response.status === 'raw') {
                    console.log(response.text);
                    if (response.text.startsWith(`L${currentLineNumber}`)) {
                        clearTimeout(timeoutTimer);
                        currentLineNumber += 1;
                        d.resolve();
                    } else if (response.text.startsWith('ERL')) {
                        const correctLineNumber = Number(response.text.substring(3).split(' ')[0]);
                        currentLineNumber = correctLineNumber;
                        let cmd = buildLineCheckCommand(command);
                        console.log(cmd);
                        ws.send(cmd);
                    } else if (response.text.startsWith('ER')) {
                        let cmd = buildLineCheckCommand(command);
                        console.log(cmd);
                        ws.send(cmd);
                    }
                }
                if (response.text.indexOf('ER:RESET') >= 0) {
                    clearTimeout(timeoutTimer);
                    d.reject(response);
                } else if (response.text.indexOf('error:') >= 0) {
                    clearTimeout(timeoutTimer);
                    d.reject(response);
                }
            };

            events.onError = (response) => {
                clearTimeout(timeoutTimer);
                d.reject(response);
            };
            events.onFatal = (response) => {
                clearTimeout(timeoutTimer);
                d.reject(response);
            };

            let cmd = buildLineCheckCommand(command);
            console.log(cmd);
            ws.send(cmd);
            return d.promise();
        };

        const prepareUpload = (d, data) => {
            const CHUNK_PKG_SIZE = 4096;
            let length = data.length || data.size,
                step = 0;

            events.onMessage = (response) => {
                if ('continue' === response.status) {
                    for (let i = 0; i < length; i += CHUNK_PKG_SIZE) {
                        let chunk = data.slice(i, i + CHUNK_PKG_SIZE);
                        step++;
                        ws.send(chunk);
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

            events.onError = (response) => { d.reject(response); };
            events.onFatal = (response) => { d.reject(response); };
        };

        ws = createWs();

        let ctrl = {
            connection: ws,
            mode: '',
            ls: (path) => {
                let d = $.Deferred();
                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        case 'connected':
                        default:
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                ws.send(`file ls ${path}`);
                return d.promise();
            },

            lsusb: () => { return useDefaultResponse('file lsusb'); },

            fileInfo: (path, fileName) => {
                let d = $.Deferred(),
                    data = [],
                    _ws;

                data.push(fileName);
                _ws = createDedicatedWs(fileInfoWsId);

                events.onMessage = (response) => {
                    data.push(response);
                    if(response.status === 'ok') {
                        d.resolve(data);
                    }
                };

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                _ws.send(`file fileinfo ${path}/${fileName}`);
                return d.promise();
            },

            report: () => {
                let d = $.Deferred(),
                    counter = 0;

                events.onMessage = (response) => {
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
                            ws.send('play report');
                        }
                    }
                };

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                setTimeout(function() { d.reject( {status: "Timeout"} )}, 3000);
                ws.send('play report');
                return d.promise();
            },

            // upload: function(filesize, print_data) {
            upload: (data, path, fileName) => {
                let d = $.Deferred();

                prepareUpload(d, data);

                if(path && fileName) {
                    fileName = fileName.replace(/ /g, '_');
                    let ext = fileName.split('.');
                    if(ext[ext.length - 1] === 'fc') {
                        ws.send(`upload application/fcode ${data.size} ${path}/${fileName}`);
                    }
                    else if(ext[ext.length - 1] === 'gcode') {
                        fileName = fileName.split('.');
                        fileName.pop();
                        fileName.push('fc');
                        fileName = fileName.join('.');
                        ws.send(`upload text/gcode ${data.size} ${path}/${fileName}`);
                    }
                }
                else {
                    ws.send(`file upload application/fcode ${data.size}`);
                }
                return d.promise();
            },

            abort: () => {
                let d = $.Deferred(),
                    counter = 0;

                const retryLength = 2000;

                const isAborted = (response) => {
                    response.device_status = response.device_status || {};
                    return response.device_status.st_id === 128 || response.device_status === 0;
                };

                const retry = (needsQuit) => {
                    counter++;
                    setTimeout(() => {
                        needsQuit ? ws.send('play abort') : ws.send('play report');
                    }, retryLength);
                };

                events.onMessage = (response) => {
                    if(counter >= 3) {
                        console.log('tried 3 times');
                        if(response.cmd === 'play report') {
                            switch(response.device_status.st_id) {
                                case 0:
                                    d.resolve();
                                    break;
                                case 64:
                                    ws.send('play quit');
                                    break;
                            }
                        }

                        d.reject(response);
                    }
                    isAborted(response) ? d.resolve() : retry(response.status !== 'ok');
                };
                events.onError = (response) => { counter >= 3 ? d.reject(response) : retry(); };
                events.onFatal = (response) => { counter >= 3 ? d.reject(response) : retry(); };

                ws.send('play abort');
                return d.promise();
            },

            start: () => { return useDefaultResponse('play start'); },

            pause: () => { return useDefaultResponse('play pause'); },

            resume: () => { return useDefaultResponse('play resume'); },

            kick: () => { return useDefaultResponse('kick'); },

            quitTask: () => {
                ctrl.mode = '';
                return useDefaultResponse('task quit');
            },

            quit: () => {
                let d = $.Deferred(),
                    counter = 0;

                const retryLength = 2000;

                const isIdle = (response) => {
                    response.device_status = response.device_status || {};
                    return response.device_status.st_id === 0;
                };

                const retry = (needsQuit) => {
                    counter++;
                    setTimeout(() => {
                        needsQuit ? ws.send('play quit') : ws.send('play report');
                    }, retryLength);
                };

                events.onMessage = (response) => { isIdle(response) ? d.resolve() : retry(response.status !== 'ok'); };
                events.onError = (response) => { counter >= 3 ? d.reject(response) : retry(); };
                events.onFatal = (response) => { counter >= 3 ? d.reject(response) : retry(); };

                ws.send('play quit');
                return d.promise();
            },

            killSelf: () => {
                let d = $.Deferred();
                dedicatedWs[fileInfoWsId].send('kick');
                dedicatedWs[fileInfoWsId].close();
                ws.send('kick');
                ws.close();
                setInterval(() => {
                    d.resolve();
                }, 500);
                return d.promise();
            },

            deviceInfo: () => { return useDefaultResponse('deviceinfo'); },

            getPreview: () => {
                let d       = $.Deferred(),
                    data    = [];

                events.onMessage = (response) => {
                    if(response.status === 'ok') {
                        data.push(response);
                        d.resolve(data);
                    }
                    else {
                        data.push(response);
                    }
                };

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.resolve(response); };

                ws.send('play info');
                return d.promise();
            },

            select: (path, fileName) => {
                return useDefaultResponse(fileName === '' ? `play select ${path.join('/')}` : `play select ${path}/${fileName}`);
            },

            deleteFile: (fileNameWithPath) => {
                return useDefaultResponse(`file rmfile ${fileNameWithPath}`);
            },

            downloadFile: (fileNameWithPath) => {
                let d = $.Deferred(),
                    file = [];

                events.onMessage = (response) => {
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

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.resolve(response); };

                ws.send(`file download ${fileNameWithPath}`);
                return d.promise();
            },

            downloadLog: (log) => {
                let d = $.Deferred(),
                    file = [];

                events.onMessage = (response) => {
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

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.resolve(response); };

                ws.send(`fetch_log ${log}`);
                return d;
            },

            downloadErrorLog: () => {
                let d = $.Deferred(),
                    file = [];

                events.onMessage = (response) => {
                    if(!~Object.keys(response).indexOf('completed')) {
                        file.push(response);
                    }

                    if(response instanceof Blob) {
                        d.resolve(file);
                    }
                };

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.resolve(response); };

                ws.send('fetch_log fluxcloudd.log');
                return d.promise();
            },

            calibrate: (clean, doubleZProbe, withoutZProbe) => {
                let d = $.Deferred(),
                    errorCount = 0,
                    temp = { debug: [] },
                    doubleZProbeDone = false;

                events.onMessage = (response) => {
                    if(response.status === 'ok') {
                        if (withoutZProbe) {
                            response.debug = temp.debug;
                            d.resolve(response);
                        } else if(response.data.length > 1) {
                            ws.send('maintain zprobe');
                        } else {
                            if (doubleZProbe&& !doubleZProbeDone) {
                                doubleZProbeDone = true;
                                ws.send('maintain zprobe');
                                return;
                            }

                            response.debug = temp.debug;
                            d.resolve(response);
                        }
                    }else if(response.status === 'operating'){
                        temp.operation_info = response;
                        d.notify(response);
                    }
                };

                events.onDebug = (response) => {
                    if(response.log){
                        if(temp.operation_info){
                            if(typeof temp.operation_info.pos !== 'undefined') {
                                response.log += ' POS ' + temp.operation_info.pos;
                            }
                            else{
                                response.log += ' Z';
                            }
                        }
                        temp.debug.push(response.log);
                    }
                };

                events.onError = (response) => {
                    if(response.status === 'error') {
                        if(errorCount === 0 && response.error[0] === 'HEAD_ERROR') {
                            setTimeout(() => {
                                errorCount++;
                                if(clean === true) {
                                    ws.send('maintain calibrating clean');
                                }
                                else {
                                    ws.send('maintain calibrating');
                                }
                            }, 500);
                        }
                        else {
                            d.reject(response);
                        }
                    }
                    else {
                        d.reject(response);
                    }
                };
                events.onFatal = (response) => { d.resolve(response); };

                let cmd = 'maintain calibrating' + (clean ? ' clean' : '');
                ws.send(cmd);
                return d.promise();
            },

            getLaserPower: () => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send('play get_laser_power');
                return d.promise();
            },

            getLaserSpeed: () => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send('play get_laser_speed');
                return d.promise();
            },

            getFan: () => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send('play get_fan');
                return d.promise();
            },

            setLaserPower: (power) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_laser_power ${power}`);
                return d.promise();
            },

            setLaserPowerTemp: (power) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_laser_power_temp ${power}`);
                return d.promise();
            },

            setLaserSpeed: (speed) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_laser_speed ${speed}`);
                return d.promise();
            },

            setLaserSpeedTemp: (speed) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_laser_speed_temp ${speed}`);
                return d.promise();
            },

            setFan: (fan) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_fan ${fan}`);
                return d.promise();
            },

            setFanTemp: (fan) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_fan_temp ${fan}`);
                return d.promise();
            },

            setOriginX: (x) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_origin_x ${x}`);
                return d.promise();
            },

            setOriginY: (y) => {
                let d = $.Deferred();

                events.onMessage = (response) => {
                    switch (response.status) {
                        case 'ok':
                            d.resolve(response);
                            break;
                        default:
                            console.log('strange message', response);
                            break;
                    }
                };

                events.onError = (response) => { d.reject(response); console.log('on error', response); };
                events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

                ws.send(`play set_origin_y ${y}`);
                return d.promise();
            },

            zprobe: () => {
                let d = $.Deferred(),
                    errorCount = 0,
                    temp = { debug: [] };

                events.onMessage = (response) => {
                    if (response.status === 'ok') {
                        response.debug = temp.debug;
                        d.resolve(response);
                    } else if (response.status === 'operating') {
                        temp.operation_info = response;
                        d.notify(response);
                    }
                };

                events.onDebug = (response) => {
                    if(response.log){
                        if(temp.operation_info){
                            if(typeof temp.operation_info.pos !== 'undefined') {
                                response.log += ' POS ' + temp.operation_info.pos;
                            }
                            else{
                                response.log += ' Z';
                            }
                        }
                        temp.debug.push(response.log);
                    }
                };

                events.onError = (response) => {
                    if(response.status === 'error') {
                        if(errorCount === 0 && response.error[0] === 'HEAD_ERROR') {
                            setTimeout(() => {
                                errorCount++;
                                ws.send('maintain zprobe');
                            }, 500);
                        }
                        else {
                            d.reject(response);
                        }
                    }
                    else {
                        d.reject(response);
                    }
                };
                events.onFatal = (response) => { d.reject(response); };
                ws.send('maintain zprobe');
                return d.promise();
            },

            getHeadInfo: () => {
                return useDefaultResponse('maintain headinfo');
            },

            getDeviceSetting: (name) => {
                return useDefaultResponse(`config get ${name}`);
            },

            setDeviceSetting: (name, value) => {
                return useDefaultResponse(`config set ${name} ${value}`);
            },

            deleteDeviceSetting: (name) => {
                return useDefaultResponse(`config del ${name}`);
            },

            getCloudValidationCode: () => {
                return useDefaultResponse('cloud_validate_code');
            },

            enableCloud: () => {
                return useDefaultResponse('config set enable_cloud A');
            },

            /**
             * enter maintain mode
             * @param {Int} timeout - timeout (ms)
             *
             * @return {Promise}
             */
            enterMaintainMode: () => {
                let d = $.Deferred();

                events.onMessage = (response) => { setTimeout(() => {
                    ctrl.mode = 'maintain';
                    d.resolve(response);
                }, 3000); };
                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                ws.send('task maintain');
                return d.promise();
            },

            showOutline: (object_height, positions) => {
              let frames = '';
              positions.forEach(function(position) {
                let frame = [position.first,
                             position.second,
                             position.third,
                             position.fourth];
                frames += JSON.stringify(frame) + ' ';
              });

              return useDefaultResponse(`laser show_outline ${object_height} ${frames}`);
            },

            maintainMove: (args) => {
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
                return useDefaultResponse(`maintain move${command}`);
            },

            maintainCloseFan: () => {
                return useDefaultResponse('maintain close_fan');
            },

            endMaintainMode: () => {
                ctrl.mode = '';
                return useDefaultResponse('task quit');
            },

            rawHome: () => {
                let d = $.Deferred();
                let isCmdResent = false;
                events.onMessage = (response) => {
                    if (response) {
                        console.log('raw homing:\t', response.text);
                    }
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
                                        ws.send('raw home');
                                    }, 200);
                                }
                        }
                    }
                };
                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };
                ws.send('raw home');
                return d.promise();
            },

            rawStartLineCheckMode: () => {
                let d = $.Deferred();
                let isCmdResent = false;
                let responseString = '';
                const command = '$@';
                events.onMessage = (response) => {
                    if (response && response.status === 'raw') {
                        console.log('raw line check:\t', response.text);
                        responseString += response.text;
                    }
                    let resps = responseString.split('\n');
                    
                    const i = resps.findIndex((r) => r === 'CTRL LINECHECK_ENABLED');
                    if (i >= 0 && resps[i+1].startsWith('ok')) {
                        isLineCheckMode = true;
                        currentLineNumber = 1;
                        d.resolve();
                    }
                    if (response.text.indexOf('ER:RESET') >= 0) {
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
                                        responseString = '';
                                        ws.send(command);
                                    }, 200);
                                }
                        }
                    }
                };
                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };
                ws.send(command);
                return d.promise();
            },

            rawEndLineCheckMode: () => {
                let d = $.Deferred();
                let isCmdResent = false;
                let responseString = '';
                const command = 'M172';
                events.onMessage = (response) => {
                    if (response && response.status === 'raw') {
                        responseString += response.text;
                    }
                    let resps = responseString.split('\n');
                    const i = resps.findIndex((r) => r === 'CTRL LINECHECK_DISABLED');
                    if (i >= 0) {
                        isLineCheckMode = false;
                        d.resolve();
                    }
                    if (response.text.indexOf('ER:RESET') >= 0) {
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
                                        responseString = '';
                                        ws.send(command);
                                    }, 200);
                                }
                        }
                    }
                };
                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };
                ws.send(command);
                return d.promise();
            },

            rawMove: (args) => {
                let command = 'G1';
                args.f = args.f || '6000';
                command += 'F' + args.f;
                if (typeof args.x !== 'undefined') {
                    command += 'X' +  Math.round(args.x * 100) / 100;
                };
                if (typeof args.y !== 'undefined') {
                    command += 'Y' + Math.round(args.y * 100) / 100;
                };
                if (!isLineCheckMode) {
                    console.log('raw move command:', command);
                    return useDefaultResponse(command);
                } else {
                    return rawLineCheckCommand(command);
                }
            },

            rawSetAirPump: (on) => {
                const command = on ? 'B3' : 'B4';
                if (!isLineCheckMode) {
                    return useDefaultResponse(command);
                } else {
                    return rawLineCheckCommand(command);
                }
            },

            rawSetFan: (on) => {
                const command = on ? 'B5' : 'B6';
                if (!isLineCheckMode) {
                    return useDefaultResponse(command);
                } else {
                    return rawLineCheckCommand(command);
                }
            },

            rawSetRotary: (on) => {
                const command = on ? 'R1\n' : 'R0\n';
                return useDefaultResponse(command);
            },

            enterRawMode: () => {
                let d = $.Deferred();

                events.onMessage = (response) => { setTimeout(() => {
                    ctrl.mode = 'raw';
                    d.resolve(response);
                }, 3000); };
                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                ws.send('task raw');
                return d.promise();
            },

            endRawMode: () => {
                ctrl.mode = '';
                return useDefaultResponse('task quit');
            },

            startToolheadOperation: () => {
                return useDefaultResponse('play toolhead operation');
            },

            endToolheadOperation: () => {
                return useDefaultResponse('play toolhead standby');
            },

            endLoadingDuringPause: () => {
                return useDefaultResponse('play press_button');
            },

            setHeadTemperatureDuringPause: (temperature) => {
                return useDefaultResponse(`play toolhead heater 0 ${temperature}`);
            },

            /**
             * maintain home
             *
             * @return {Promise}
             */
            maintainHome: () => {
                return useDefaultResponse('maintain home');
            },

            /**
             * change filament
             * @param {String} type - [LOAD|UNLOAD]
             *
             * @return {Promise}
             */
            changeFilament: (type, flexible) => {
                let d = $.Deferred(),
                    timeout;

                const getType = (t) => {
                    if (flexible) return 'load_flexible_filament';
                    return t === DeviceConstants.LOAD_FILAMENT ? 'load_filament' : 'unload_filament';
                };

                events.onMessage = (response) => {

                    clearTimeout(timeout);
                    timeout = setTimeout( () => {
                        response = {
                          stage  : ["DISCONNECTED", "DISCONNECTED"],
                          status : "error",
                          error  : ["DISCONNECTED", ""]
                        }
                        d.notify(response);
                    }, 10 * 500);

                    response.status !== 'ok' ? d.notify(response) : d.resolve(response);
                };

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                setTimeout(() => {
                    ws.send(`maintain ${getType(type)} 0 220`);
                }, 3000);

                return d.promise();
            },

            changeFilamentDuringPause: (type) => {
                let cmd = type === 'LOAD' ? 'load_filament' : 'unload_filament';
                return useDefaultResponse(`play ${cmd} 0`);
            },

            setHeadTemperature: (temperature) => {
                return useDefaultResponse(`maintain set_heater 0 ${temperature}`);
            },

            getHeadStatus: () => {
                return useDefaultResponse('maintain headstatus');
            },

            /**
             * update firmware
             * @param {File} file - file
             */
            fwUpdate: (file) => {
                let d = $.Deferred(),
                    blob = new Blob([file], { type: 'binary/flux-firmware' });

                events.onMessage = (response) => {
                    switch (response.status) {
                    case 'ok':
                        d.resolve(response);
                        break;
                    case 'continue':
                        d.notify(response);
                        ws.send(blob);
                        break;
                    case 'uploading':
                        response.percentage = (response.sent || 0) / blob.size * 100;
                        d.notify(response);
                        break;
                    default:
                        d.reject(response);
                    }
                };

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                ws.send(`update_fw binary/flux-firmware ${blob.size}`);

                return d.promise();
            },

            /**
             * update toolhead firmware - device should in `Maintain mode`
             * @param {File} file - file
             */
            toolheadUpdate: (file) => {
                let d = $.Deferred(),
                    mimeType = 'binary/flux-firmware',
                    blob = new Blob([file], { type: mimeType }),
                    args = [
                        'maintain',
                        'update_hbfw',
                        'binary/fireware',
                        blob.size
                    ];

                events.onMessage = (response) => {
                    switch (response.status) {
                    case 'ok':
                        d.resolve(response);
                        break;
                    case 'continue':
                        d.notify(response);
                        ws.send(blob);
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

                events.onError = (response) => { d.reject(response); };
                events.onFatal = (response) => { d.reject(response); };

                ws.send(args.join(' '));
                return d.promise();
            }
        };

        ctrl.maintainClean = function(){
            return ctrl.calibrate(true);
        };

        ctrl.calibrateDoubleZProbe = function(){
            return ctrl.calibrate(true, true);
        };

        ctrl.calibrateWithoutZProbe = function(){
            return ctrl.calibrate(true, false, true);
        };

        return ctrl;
    };
});
