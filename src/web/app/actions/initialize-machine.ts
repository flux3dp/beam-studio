/**
 * initialize machine helper
 */
import config from 'helpers/api/config';
import storage from 'helpers/storage-helper';
import settings from '../app-settings';
import { IDeviceInfo } from 'interfaces/IDevice';

var methods = {
    reset: function(callback) {
        callback = ('function' === typeof callback ? callback : function() {});
        config().write('printer-is-ready', false);
        callback();
    },
    completeSettingUp: function(redirect) {
        let d = $.Deferred();
        var completed = methods.hasBeenCompleted();

        redirect = ('boolean' === typeof redirect ? redirect : true);

        // add laser-default
        config().write('laser-defaults', JSON.stringify(settings.laser_default));

        config().write('printer-is-ready', true, {
            onFinished: function() {
                methods.settedPrinter.add(
                    methods.settingPrinter.get()
                );

                methods.settingPrinter.clear();
                methods.settingWifi.clear();

                if (true === redirect) {
                    location.hash = '#studio/beambox';
                }
                d.resolve();
            }
        });
        return d.promise();
    },
    hasBeenCompleted: function() {
        // If you initialized before and you're not in initialization screen
        return config().read('printer-is-ready') && (!~location.href.indexOf('initialize/'));
    },
    settingPrinter: {
        get: function() {
            return storage.get('setting-printer');
        },
        set: function(printer) {
            storage.set('setting-printer', printer);
        },
        clear: function() {
            storage.removeAt('setting-printer');
        }
    },
    settedPrinter: {
        get: function(): any[] {
            return storage.get('printers') as unknown as any[];
        },
        set: function(printers) {
            storage.set('printers', printers);
        },
        add: function(printer) {
            var settedPrinters = methods.settedPrinter.get(),
                findPrinter = function(existingPrinter) {
                    return existingPrinter.uuid === printer.uuid;
                };

            if ('object' === typeof printer && false === settedPrinters.some(findPrinter)) {
                settedPrinters.push(printer);
            }

            storage.set('printers', JSON.stringify(settedPrinters));
        },
        removeAt: function(printer) {
            var settedPrinters = methods.settedPrinter.get(),
                survivalPrinters = [];

            settedPrinters.forEach(function(el) {
                if (el.uuid !== printer.uuid) {
                    survivalPrinters.push(el);
                }
            });

            methods.settedPrinter.set(survivalPrinters);
        },
        clear: function() {
            storage.removeAt('printers');
        }
    },
    settingWifi: {
        get: function() {
            return storage.get('setting-wifi') || {};
        },
        set: function(wifi) {
            storage.set('setting-wifi', wifi);
        },
        clear: function() {
            storage.removeAt('setting-wifi');
        }
    },
    defaultPrinter: {
        set: function(printer) {
            config().write('default-printer', JSON.stringify(printer));
        },
        exist: function() {
            var defaultPrinter = config().read('default-printer') || {};

            return ('string' === typeof defaultPrinter['uuid']);
        },
        get: function(): IDeviceInfo {
            const defaultDevice = (config().read('default-printer') || {}) as IDeviceInfo;
            return defaultDevice;
        },
        clear: function() {
            storage.removeAt('default-printer');
        }
    }
};

export default methods;
