import $ from 'jquery';
import * as i18n from '../../helpers/i18n';
import shortcuts from '../../helpers/shortcuts';
import config from '../../helpers/api/config';
import Logger from '../../helpers/logger';
import DeviceMaster from '../../helpers/device-master';
import AlertActions from './alert-actions';
import { getSVGAsync } from '../../helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });
const lang = i18n.lang;
const FLUX = window['FLUX'];
const analytics = window['analytics'];
const electron = window['electron'];
// prevent delete (back) behavior

var genericLogger = Logger('generic'),
    defaultKeyBehavior = function() {
        shortcuts.on(['BACK'], function(e) {
            // always prevent default, and implement delete function our own.
            e.preventDefault();

            var value,
                selectionStart,
                samePosition,
                deleteStart,
                deleteCount,
                me = e.target,
                hasSelectionStart = true,
                inputType = (me.type || '').toUpperCase(),
                acceptedInput = ['TEXT', 'NUMBER', 'PASSWORD', 'TEL', 'URL', 'SEARCH', 'EMAIL'];

            if (('INPUT' === me.tagName &&
                -1 < acceptedInput.indexOf(inputType) || 'TEXTAREA' === me.tagName)
            ) {
                try {
                    selectionStart = me.selectionStart;
                }
                catch (ex) {
                    hasSelectionStart = false;

                    if ('INPUT' === me.tagName) {
                        me.setAttribute('type', 'TEXT');
                    }
                }

                selectionStart = me.selectionStart;
                value = me.value.split('');
                samePosition = me.selectionEnd === selectionStart;
                deleteCount = (
                    true === samePosition ? // same position
                    1 :
                    e.target.selectionEnd - selectionStart
                );
                deleteStart = (
                    true === samePosition ? // same position
                    selectionStart - 1 :
                    selectionStart
                );

                value.splice(deleteStart, deleteCount);
                e.target.value = value.join('');
                e.target.setSelectionRange(selectionStart - 1, selectionStart - 1);

                if ('INPUT' === me.tagName && false === hasSelectionStart) {
                    me.setAttribute('type', inputType);
                }
            }
        });

        var FN_KEY = process.platform === "darwin" ? "cmd" : "ctrl";

        shortcuts.on([FN_KEY, 'a'], function() { window.document.execCommand('selectAll'); });
        shortcuts.on([FN_KEY, '0'], function() { console.log("Reset View!"); svgEditor.resetView(); });
        shortcuts.on([FN_KEY, 'plus'], function() { console.log("Zoom In"); svgEditor.zoomIn(); });
        shortcuts.on([FN_KEY, 'minus'], function() { console.log("Zoom Out"); svgEditor.zoomOut(); });
        shortcuts.on([FN_KEY, 'num_plus'], function() { console.log("Zoom In with numpad +"); svgEditor.zoomIn(); });
        shortcuts.on([FN_KEY, 'num_minus'], function() { console.log("Zoom Out with numpad -"); svgEditor.zoomOut(); });

        shortcuts.on(['ctrl', 'alt', 'd'], function(e) {
            if(electron) {
                electron.ipc.send("DEBUG-INSPECT");
            }
        });

        shortcuts.on(['ctrl', 'alt', 'd'], function(e) {
            // TODO:
            window.location.href = '/debug-panel/index.html';
        });
    };

defaultKeyBehavior();

// detached keyup and keydown event
window.addEventListener('popstate', function(e) {
    if(FLUX.allowTracking && analytics) {
        analytics.event('send', 'pageview', location.hash);
    }
    shortcuts.disableAll();
    // TODO
    defaultKeyBehavior();
});

// GA Import Begin
$('body').on('click', '[data-ga-event]', function(e) {
    var $self = $(e.currentTarget);
    if(FLUX.allowTracking && analytics) {
        analytics.event('send', 'event', 'button', 'click', $self.data('ga-event'));
    }
});

//GA Import End

window.onerror = function(message, source, lineno, colno, error) {
    genericLogger.append([message, source, lineno].join(' '));
};

//Process Visual C++ Redistributable Check
FLUX.processPythonException = function(exception_str){
    if(exception_str.indexOf("ImportError: DLL load failed") !== -1){
        AlertActions.showPopupError(
            'error-vcredist',
            lang.support.no_vcredist
        );
    }
}

export default function(callback) {
    var $body = $('body'),
        hash = location.hash,
        onFinished = function(data) {
            var is_ready = data;

            if (true === is_ready && ('' === hash || hash.startsWith('#initialize'))) {
                location.hash = "#studio/beambox";
            }
            else if (false === is_ready && false === hash.startsWith('#initialize')) {
                location.hash = '#';
            }

            callback();
        },
        opt = {
            onError: onFinished
        };

    // todo: does not support on error?
    config().read('printer-is-ready', {
        onFinished: onFinished
    });
};
