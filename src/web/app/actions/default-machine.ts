/**
 * initialize machine helper
 */
import config from '../../helpers/api/config';
import { IDeviceInfo } from '../../interfaces/IDevice';

export default {
    set: (device) => {
        config().write('default-printer', JSON.stringify(device));
    },
    exist: () => {
        let defaultPrinter: IDeviceInfo = config().read('default-printer') as IDeviceInfo;
        return (defaultPrinter && 'string' === typeof defaultPrinter.uuid);
    },
    get: () => {
        return config().read('default-printer') || {};
    },
    clear: () => {
        config().remove('default-printer');
    }
};
