import * as i18n from './i18n';

const lang = i18n.lang;

const self = {
    /**
     * Error as constants
     */
    Errors: {
        DEFAULT: 0,
        RESOURCE_BUSY: 1,
        TIMEOUT: 2,
        TYPE_ERROR: 3,
        UNKNOWN_COMMAND: 4,
        KICKED: 5
    },
    /**
    * Translate device error into readable language
    * @param {String|String[]} error - some string or array
    */
    translate: (error) => {
        // always process error as array, hard fix for the backend
        error = (error instanceof Array ? error : [error]);

        let errorOutput = '';

        if (error.length) {
            if (lang.generic_error[error[0]]) {
                return lang.generic_error[error[0]];
            }
            errorOutput = lang.monitor[error.slice(0, 2).join('_')];
            if (errorOutput === '' || typeof errorOutput === 'undefined') {
                errorOutput = error.join(' ');
            }
        }

        if (typeof errorOutput === 'object') {
            errorOutput = JSON.stringify(errorOutput);
        }

        return errorOutput || '';
    },
    /**
     * Process change filament response
     * @param {Object} response - Error response from change filament command
     */
    processChangeFilamentResponse: (response) => {
        if ('RESOURCE_BUSY' === response.error[0]) {
            return self.Errors.DEFAULT;
        }
        else if ('TIMEOUT' === response.error[0]) {
            return self.Errors.TIMEOUT;
        }
        else if (response.info === 'TYPE_ERROR') {
            return self.Errors.TYPE_ERROR;
        }
        else if ('UNKNOWN_COMMAND' === response.error[0]) {
            return self.Errors.UNKNOWN_COMMAND;
        }
        else if ('KICKED' === response.error[0]) {
            return self.Errors.KICKED;
        }
        else {
            return self.Errors.DEFAULT;
        }
    },
    /**
     * Regularize error message
     */
    processDeviceMasterResponse: (response) => {
        if (response.info === 'RESOURCE_BUSY') { response.error = ['RESOURCE_BUSY']; }
        if (response.module === 'LASER') { response.error = ['HEAD_ERROR', 'TYPE_ERROR']; }
        // if (!response.module) { response.error = ['HEAD_ERROR', "HEAD_OFFLINE"]; }
        return response;
    }
};

export default self;
