/**
 * check device status and action
 */
import $ from 'jquery';
import * as i18n from './i18n';
import DeviceMaster from './device-master';
import DeviceConstants from '../app/constants/device-constants';
import PreviewModeController from '../app/actions/beambox/preview-mode-controller';
import Alert from '../app/actions/alert-caller';
import AlertConstants from '../app/constants/alert-constants';
import Progress from '../app/actions/progress-caller';

const lang = i18n.lang;

export default async function(printer, allowPause?: boolean, forceAbort?: boolean) {
    if(!printer) { return; }
    const deferred = $.Deferred();

    const onYes = async (id) => {
        let timer;
        if (PreviewModeController.isPreviewMode()) {
            await PreviewModeController.end();
        }
        const res = await DeviceMaster.select(printer);
        if (!res.success) {
            deferred.resolve(false);
            return;
        }
        switch (id) {
            case 'kick':
                await DeviceMaster.kick();
                await new Promise((resolve) => setTimeout(resolve, 500));
                deferred.resolve('ok');
                break;
            case 'abort':
                Progress.openNonstopProgress({
                    id: 'device-master-abort',
                    timeout: 30000,
                });
                await DeviceMaster.stop();
                timer = setInterval(async () => {
                    const report = await DeviceMaster.getReport();
                    if (report.st_id === DeviceConstants.status.ABORTED) {
                        setTimeout(function() {
                            DeviceMaster.quit();
                        }, 500);
                    } else if (report.st_id === DeviceConstants.status.IDLE) {
                        clearInterval(timer);
                        Progress.popById('device-master-abort');
                        deferred.resolve('ok', report.st_id);
                    }
                }, 1000);
                break;
        }
    };

    switch (printer.st_id) {
        // null for simulate
        case null:
        // null for not found default device
        case undefined:
        case DeviceConstants.status.IDLE:
            // no problem
            deferred.resolve('ok');
            break;
        case DeviceConstants.status.RAW:
        case DeviceConstants.status.SCAN:
        case DeviceConstants.status.MAINTAIN:
            // ask kick?
            Alert.popUp({
                id: 'kick',
                message: lang.message.device_is_used,
                buttonType: AlertConstants.YES_NO,
                onYes: () => {onYes('kick')},
                onNo: () => {deferred.resolve(false)}
            });
            break;
        case DeviceConstants.status.COMPLETED:
        case DeviceConstants.status.ABORTED:
            // quit
            const res = await DeviceMaster.select(printer);
            if (res.success) {
                await DeviceMaster.quit();
                deferred.resolve('ok');
            } else {
                deferred.resolve(false);
            }
            break;
        case DeviceConstants.status.RUNNING:
        case DeviceConstants.status.PAUSED:
        case DeviceConstants.status.PAUSED_FROM_STARTING:
        case DeviceConstants.status.PAUSED_FROM_RUNNING:
        case DeviceConstants.status.PAUSING_FROM_STARTING:
        case DeviceConstants.status.PAUSING_FROM_RUNNING:
            if(allowPause) {
                deferred.resolve('ok', printer.st_id);
            }
            else {
                // ask for abort
                if (forceAbort) {
                    onYes('abort');
                } else {
                    Alert.popUp({
                        id: 'abort',
                        message: lang.message.device_is_used,
                        buttonType: AlertConstants.YES_NO,
                        onYes: () => {onYes('abort')},
                        onNo: () => {deferred.resolve(false)}
                    });
                }
            }
            break;
        default:
            // device busy
            console.log('Device Busy ', printer.st_id);
            Alert.popUp({
                id: 'on-select-printer',
                caption: lang.message.device_busy.caption,
                message: lang.message.device_busy.message,
            });
            break;
    }

    return deferred.promise();
};
