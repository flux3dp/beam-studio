/**
 * initialize machine helper
 */
define([
    'helpers/api/config',
], function(
    config,
) {
    'use strict';

    return {
        set: (device) => {
            config().write('default-printer', JSON.stringify(device));
        },
        exist: () => {
            let defaultPrinter = config().read('default-printer') || {};

            return ('string' === typeof defaultPrinter.uuid);
        },
        get: () => {
            return config().read('default-printer') || {};
        },
        clear: () => {
            config().removeItem('default-printer');
        }
    };
});
