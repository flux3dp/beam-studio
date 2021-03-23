/**
 * API svg laser parser
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-svg-laser-parser
 */
import $ from 'jquery';
import Alert from '../../app/actions/alert-caller';
import AlertConstants from '../../app/constants/alert-constants';
import Progress from '../../app/actions/progress-caller';
import BeamboxPreference from '../../app/actions/beambox/beambox-preference';
import Websocket from '../websocket';
import convertToTypedArray from '../convertToTypedArray';
import history from '../data-history';
import AlertConfig from './alert-config';
import setParams from './set-params';
import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });

const fs = requireNode('fs');
const path = requireNode('path');

// Because the preview image size is 640x640
var MAXWIDTH = 640;

export default function(opts) {
    opts = opts || {};
    opts.type = opts.type || 'laser';

    var apiMethod = {
            laser: 'svg-laser-parser',
            svgeditor: 'svgeditor-laser-parser',
            draw: 'pen-svg-parser',
            cut: 'svg-vinyl-parser',
            mill: 'svg-vinyl-parser'
        }[opts.type],
        ws = Websocket({
            method: apiMethod,
            onMessage: function(data) {
                events.onMessage(data);
            },

            onError: function(data) {
                events.onError(data);
            },

            onFatal: opts.onFatal
        }),
        uploaded_svg = [],
        lastOrder = '',
        events = {
            onMessage: (resp: any) => {},
            onError: (resp: any) => {}
        },
        History = history(),
        goNextUpload = true,
        uploadQueue = [],
        computePreviewImageSize = function(size) {
            var height = size.height,
                width = size.width,
                longerSide = Math.max(width, height),
                ratio;

            ratio = MAXWIDTH / longerSide;
            height = height * ratio;
            width = width * ratio;

            return {
                width: width,
                height: height
            };
        };

    return {
        connection: ws,
        History: History,
        /**
         * upload svg
         *
         * @param {ArrayObject} files - the file data that convert by File-Uploader
         *
         * @return {Promise}
         */
        upload: function(files, opts) {
            var self = this,
                $deferred = $.Deferred(),
                length = files.length,
                currIndex = 0,
                order_name = 'upload',
                setMessages = function(file, isBroken, warningCollection) {
                    file.status = (0 < warningCollection.length ? 'bad' : 'good');
                    file.messages = warningCollection;
                    file.isBroken = isBroken;

                    return file;
                },
                sendFile = function(file) {
                    var warningCollection = [];

                    events.onMessage = function(data) {

                        switch (data.status) {
                            case 'continue':
                                ws.send(file.data);
                                break;
                            case 'ok':
                                self.get(file).done(function(response) {
                                    file.blob = response.blob;
                                    file.imgSize = response.size;

                                    file = setMessages(file, false, warningCollection);
                                    $deferred.notify('next');
                                });
                                break;
                            case 'warning':
                                warningCollection.push(data.message);
                                break;
                        }

                    };
                    events.onError = function(data) {
                        warningCollection.push(data.error);
                        file = setMessages(file, true, warningCollection);
                        $deferred.notify('next');
                    };
                    var args = [
                        order_name,
                        file.uploadName,
                        file.size
                    ];
                    if (opts && opts.model === 'fbb1p') {
                        args.push('-pro');
                    }
                    ws.send(args.join(' '));
                };

            $deferred.progress(function(action) {
                var file,
                    hasBadFiles = false;

                if ('next' === action) {
                    file = files[currIndex];

                    if ('undefined' === typeof file) {
                        hasBadFiles = files.some(function(file) {
                            return 'bad' === file.status;
                        });
                        $deferred.resolve({files: files, hasBadFiles: hasBadFiles });
                    } else if (file.extension && 'svg' === file.extension.toLowerCase()) {
                        sendFile(file);
                        currIndex += 1;
                    } else {
                        setMessages(file, true, ['NOT_SUPPORT']);
                        currIndex += 1;
                        $deferred.notify('next');
                    }
                }
            });

            $deferred.notify('next');

            return $deferred.promise();
        },
        /**
         * get svg
         *
         * @param {File} file - the file object
         *
         * @return {Promise}
         */
        get: function(file) {
            lastOrder = 'get';

            var $deferred = $.Deferred(),
                args = [
                    lastOrder,
                    file.uploadName
                ],
                blobs = [],
                blob,
                total_length = 0,
                size = {
                    height: 0,
                    width: 0
                };

            events.onMessage = function(data) {

                if ('continue' === data.status) {
                    total_length = data.length;
                    size.height = data.height;
                    size.width = data.width;
                } else if (true === data instanceof Blob) {
                    blobs.push(data);
                    blob = new Blob(blobs, { type: file.type });

                    if (total_length === blob.size) {
                        History.push(file.uploadName, { size: size, blob: blob });
                        $deferred.resolve({ size: size, blob: blob });
                    }
                }

            };

            events.onError = function(response) {
                $deferred.reject(response);
            };

            ws.send(args.join(' '));

            return $deferred.promise();
        },
        /**
         * compute svg
         *
         * @param {ArrayObject} args - detail json object below [{}, {}, ...]
         *      {Int}   width         - width pixel
         *      {Int}   height        - height pixel
         *      {Float} tl_position_x - top left x
         *      {Float} tl_position_y - top left y
         *      {Float} br_position_x - bottom right x
         *      {Float} br_position_y - bottom right y
         *      {Float} rotate        - rotate
         *      {Int}   threshold     - threshold (0~255)
         *      {Array} image_data    - grayscale image data
         * @return {Promise}
         */
        compute: function(args) {
            var $deferred = $.Deferred(),
                requests = [],
                requestHeader,
                nextData,
                currIndex = 0,
                sendData = (nextData) => {
                    ws.send(nextData);
                    currIndex += 1;

                    nextData = requests[currIndex];

                    if (true === nextData instanceof Uint8Array) {
                        sendData(nextData);
                    }
                };

            lastOrder = 'compute';

            args.forEach(function(obj) {
                requestHeader = [
                    lastOrder,
                    obj.name,
                    obj.real_width,
                    obj.real_height,
                    obj.tl_position_x,
                    obj.tl_position_y,
                    obj.br_position_x,
                    obj.br_position_y,
                    obj.rotate,
                    obj.svg_data.blob.size,
                    parseInt(obj.width, 10),
                    parseInt(obj.height, 10)
                ];

                requests.push(requestHeader.join(' '));
                requests.push(obj.svg_data.blob);
                requests.push(convertToTypedArray(obj.image_data, Uint8Array));
            });

            events.onMessage = function(data) {
                switch (data.status) {
                case 'continue':
                case 'ok':
                    $deferred.notify('next');
                    break;
                default:
                    // TODO: do something?
                    break;
                }
            };

            $deferred.progress((action) => {
                nextData = requests[currIndex];

                if ('next' === action && 'undefined' !== typeof nextData) {
                    sendData(nextData);
                }
                else {
                    $deferred.resolve();
                }
            });

            $deferred.notify('next');

            return $deferred.promise();
        },
        getTaskCode: function(names, opts) {
            opts = opts || {};
            opts.onProgressing = opts.onProgressing || function() {};
            opts.onFinished = opts.onFinished || function() {};
            lastOrder = 'getTaskCode';

            var args = [
                    'go',
                    names.join(' '),
                    opts.fileMode || '-f'
                ],
                blobs = [],
                duration,
                total_length = 0,
                blob;

            if (opts.model === 'fbb2b') {
                args.push('-bb2');
            } else if (opts.model === 'fbb1p') {
                args.push('-pro');
            } else if (opts.model === 'fbm1') {
                args.push('-beamo');
            }
            if (opts.codeType === 'gcode') {
                args.push('-gc')
            }

            if (svgCanvas && svgCanvas.getRotaryMode()) {
                args.push('-spin');
                args.push(svgCanvas.runExtensions('getRotaryAxisAbsoluteCoord'));
            }

            if (i18n.getActiveLang() === 'zh-cn' && BeamboxPreference.read('blade_radius') && BeamboxPreference.read('blade_radius') > 0) {
                args.push('-blade');
                args.push(BeamboxPreference.read('blade_radius'));
                if (BeamboxPreference.read('blade_precut')) {
                    args.push('-precut');
                    args.push(`${BeamboxPreference.read('precut_x') || 0},${BeamboxPreference.read('precut_y') || 0}`);
                }
            }

            if (opts.enableAutoFocus) {
                args.push('-af');
            }

            if (opts.enableDiode) {
                args.push('-diode');
                args.push(`${BeamboxPreference.read('diode_offset_x') || 0},${BeamboxPreference.read('diode_offset_y') || 0}`);
            }

            if (opts.shouldUseFastGradient) {
                args.push('-fg');
            }

            if (opts.vectorSpeedConstraint) {
                args.push('-vsc');
            }

            if (BeamboxPreference.read('stripe_compensation')) {
                args.push('-strpcom');
                args.push(`${BeamboxPreference.read('stripe_compensation_y0') || 0},${BeamboxPreference.read('stripe_compensation_interval') || 0},${BeamboxPreference.read('stripe_compensation_power') || 100}`);
            }

            events.onMessage = function(data) {

                if ('computing' === data.status) {
                    opts.onProgressing(data);
                } else if ('complete' === data.status) {
                    total_length = data.length;
                    duration = Math.floor(data.time) + 1;
                } else if (true === data instanceof Blob) {
                    blobs.push(data);
                    blob = new Blob(blobs);

                    if (total_length === blob.size) {
                        opts.onFinished(blob, args[2], duration);
                    }
                } else if ('Error' === data.status) {
                    opts.onError(data.message);
                }
            };

            let loop_compensation = Number(storage.get('loop_compensation') || '0');
            if (loop_compensation > 0) {
                ws.send(['set_params', 'loop_compensation', loop_compensation].join(' '));
            }
            ws.send(args.join(' '));
        },
        divideSVG: function(opts?) {
            var $deferred = $.Deferred();
            opts = opts || {};
            opts.onProgressing = opts.onProgressing || function() {};
            opts.onFinished = opts.onFinished || function() {};
            lastOrder = 'divideSVG';

            var args = ['divide_svg'],
                blobs = [],
                duration,
                currentLength = 0,
                finalBlobs = {},
                currentName = '';

            if (opts.scale) {
                args.push('-s');
                args.push(String(Math.floor(opts.scale * 100) / 100));
            }

            events.onMessage = function(data) {
                if (data.name) {
                    currentName = data.name;
                    currentLength = data.length;
                    if (currentName == 'bitmap') {
                        finalBlobs["bitmap_offset"] = data.offset;
                    }
                } else if (data instanceof Blob) {
                    blobs.push(data);
                    var blob = new Blob(blobs);

                    if (currentLength === blob.size) {
                        blobs = [];
                        finalBlobs[currentName] = blob;
                    }
                } else if (data.status === 'ok') {
                    $deferred.resolve({res: true, data: finalBlobs});
                } else if (data.status === 'Error') {
                    Progress.popById('loading_image');
                    $deferred.resolve({res: false, data: data.message});
                }

            };

            ws.send(args.join(' '));

            if (opts.timeout && opts.timeout > 0) {
                setTimeout(() => {
                    $deferred.resolve({res: false, data: 'timeout'});
                }, opts.timeout);
            }
            return $deferred.promise();
        },
        divideSVGbyLayer: function(opts?) {
            var $deferred = $.Deferred();
            opts = opts || {};
            opts.onProgressing = opts.onProgressing || function() {};
            opts.onFinished = opts.onFinished || function() {};
            lastOrder = 'divideSVGbyLayer';

            var args = ['divide_svg_by_layer'],
                blobs = [],
                duration,
                currentLength = 0,
                finalBlobs = {},
                currentName = '';

            if (opts.scale) {
                args.push('-s');
                args.push(String(Math.floor(opts.scale * 100) / 100));
            }

            events.onMessage = function(data) {
                if (data.name) {
                    currentName = data.name;
                    currentLength = data.length;
                    if (currentName == 'bitmap') {
                        finalBlobs["bitmap_offset"] = data.offset;
                    }
                } else if (data instanceof Blob) {
                    blobs.push(data);
                    var blob = new Blob(blobs);

                    if (currentLength === blob.size) {
                        blobs = [];
                        finalBlobs[currentName] = blob;
                    }
                } else if (data.status === 'ok') {
                    $deferred.resolve({res: true, data: finalBlobs});
                } else if (data.status === 'Error') {
                    Progress.popById('loading_image');
                    $deferred.resolve({res: false, data: data.message});
                }

            };

            ws.send(args.join(' '));
            return $deferred.promise();
        },
        uploadPlainSVG: function(file, skipVersionWarning = false) {
            var $deferred = $.Deferred();
            const warningCollection = [];

            events.onMessage = function(data) {
                switch (data.status) {
                    case 'continue':
                        ws.send(file);
                        break;
                    case 'ok':
                        $deferred.resolve('ok');
                        break;
                    case 'warning':
                        warningCollection.push(data.message);
                        break;
                }
            };

            events.onError = function(data) {
                alert(data);
            };
            function getBasename(path?: string) {
                if (!path) return '';
                const pathMatch = path.match(/(.+)[\/\\].+/);
                if (pathMatch[1]) return pathMatch[1];
                return '';
            }
            var reader = new FileReader();
            reader.onloadend = function (e) {
                let svgString = e.target.result as string;
                const matchImages = svgString.match(/<image[^>]+>/g);
                let allImageValid = true;
                let hasPath = false;
                if (matchImages) {
                    const basename = getBasename(file.path);
                    for (let i = 0; i < matchImages.length; i++) {
                        let hrefMatch = matchImages[i].match(/xlink:href="[^"]+"/);
                        if (!hrefMatch) {
                            continue;
                        }
                        const hrefRaw = hrefMatch[0];
                        const hrefCleaned = hrefRaw.substring(12, hrefRaw.length - 1);
                        if (hrefCleaned.startsWith('data:')) {
                            continue;
                        }
                        let newPath = hrefCleaned.replace(/&apos;/g, '\'').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
                        // Test Abosulte Path
                        hasPath = true;
                        if (fs.existsSync(newPath)) {
                            continue;
                        }
                        // Test Relative Path
                        if (file.path) {
                            newPath = path.join(basename, newPath);
                            if (fs.existsSync(newPath)) {
                                newPath = newPath.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
                                svgString = svgString.replace(`xlink:href="${hrefCleaned}"`, `xlink:href="${newPath}"`);
                                continue;
                            }
                        }
                        allImageValid = false;
                        $deferred.resolve('invalid_path');
                    }
                }
                let version;
                const LANG = i18n.lang.beambox.popup;
                if (!skipVersionWarning && !AlertConfig.read('skip_svg_version_warning')) {
                    const matchSVG = svgString.match(/<svg[^>]*>/g)[0];
                    version = matchSVG.match(/ version="[^"]+"/);
                    if (version) {
                        version = version[0].substring(10, version[0].length -1);
                        if (version === '1.1') {
                            Alert.popUp({
                                type: AlertConstants.SHOW_POPUP_WARNING,
                                message: LANG.svg_1_1_waring,
                                checkbox: {
                                    text: LANG.dont_show_again,
                                    callbacks: () => {AlertConfig.write('skip_svg_version_warning', true)}
                                }
                            });
                        }
                    }
                }
                if (allImageValid && hasPath) {
                    if (!AlertConfig.read('skip_image_path_warning')) {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_WARNING,
                            message: LANG.svg_image_path_waring,
                            checkbox: {
                                text: LANG.dont_show_again,
                                callbacks: () => {AlertConfig.write('skip_image_path_warning', true)}
                            }
                        });
                    }
                }

                if (allImageValid) {
                    file = new Blob([svgString], {
                        type: 'text/plain'
                    });

                    ws.send([
                        'upload_plain_svg',
                        'plain-svg',
                        file.size
                    ].join(' '));
                }
            };
            reader.readAsText(file);

            return $deferred.promise();
        },
        uploadPlainTextSVG: function($textElement, bbox) {
            var $deferred = $.Deferred();
            const warningCollection = [];

            events.onMessage = function(data) {
            switch (data.status) {
                case 'continue':
                    ws.send(file);
                    break;
                case 'ok':
                    $deferred.resolve('ok');
                    break;
                case 'warning':
                    warningCollection.push(data.message);
                    break;
                }
            };

            events.onError = function(data) {
                alert(data);
            };
            let textString = $textElement.prop('outerHTML');
            if ($textElement.data('verti')) {
                textString = textString.replace(/letter-spacing="[^"]+"/, '');
            }
            let svgString = `<svg viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}">
                ${textString}
            </svg>`
            console.log(svgString)
            let file = new Blob([svgString], {
                type: 'text/plain'
            });
            ws.send([
                'upload_plain_svg',
                'text-svg',
                file.size
            ].join(' '));
            return $deferred.promise();
        },
            
        uploadToSvgeditorAPI: function(files, opts) {
            var $deferred = $.Deferred(),
                currIndex = 0,
                order_name = 'svgeditor_upload',
                setMessages = function(file, isBroken, warningCollection) {
                    file.status = (0 < warningCollection.length ? 'bad' : 'good');
                    file.messages = warningCollection;
                    file.isBroken = isBroken;

                    return file;
                },

                sendFile = function(file) {
                    var warningCollection = [];

                    events.onMessage = function(data) {
                        switch (data.status) {
                            case 'computing':
                                opts.onProgressing(data);
                                break;
                            case 'continue':
                                ws.send(file.data);
                                break;
                            case 'ok':
                                opts.onFinished();
                                $deferred.resolve();
                                break;
                            case 'warning':
                                warningCollection.push(data.message);
                                break;
                            case 'Error':
                                opts.onError(data.message);
                                $deferred.resolve();
                                break;
                        }
                    };

                    events.onError = function(data) {
                        warningCollection.push(data.error);
                        file = setMessages(file, true, warningCollection);
                        $deferred.notify('next');
                    };
                    var args = [
                        order_name,
                        file.uploadName,
                        file.size,
                        file.thumbnailSize
                    ];

                    if (opts) {
                        switch (opts.model) {
                            case 'fbb1p':
                                args.push('-pro');
                                break;
                            case 'fbm1':
                                args.push('-beamo');
                                break;
                        }
                        switch (opts.engraveDpi) {
                            case 'low':
                                args.push('-ldpi');
                                break;
                            case 'medium':
                                args.push('-mdpi');
                                break;
                            case 'high':
                                args.push('-hdpi');
                                break;
                            case 'ultra':
                                args.push('-udpi');
                                break;
                        }
                        if (opts.enableMask) {
                            args.push('-mask');
                        }
                    }
                    ws.send(args.join(' '));
                };

            $deferred.progress(function(action) {
                var file,
                    hasBadFiles = false;

                if ('next' === action) {
                    file = files[currIndex];

                    if ('undefined' === typeof file) {
                        hasBadFiles = files.some(function(file) {
                            return 'bad' === file.status;
                        });
                        $deferred.resolve({files: files, hasBadFiles: hasBadFiles });
                    } else if (file.extension && 'svg' === file.extension.toLowerCase()) {
                        sendFile(file);
                        currIndex += 1;
                        console.log('currIndex', currIndex)
                    } else {
                        setMessages(file, true, ['NOT_SUPPORT']);
                        currIndex += 1;
                        $deferred.notify('next');
                    }
                }
            });

            $deferred.notify('next');

            return $deferred.promise();
        },

        interruptCalculation: () => {
            ws.send('interrupt');
            events.onMessage = function(data) {
                switch (data.status) {
                    case 'ok':
                        console.log('calculation interrupted');
                        break;
                }
            };
        },

        params: setParams(ws, events),
        computePreviewImageSize: computePreviewImageSize
    };
};
