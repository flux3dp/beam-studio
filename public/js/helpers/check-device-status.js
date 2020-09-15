/**
 * check device status and action
 */
define([
    'jquery',
    'helpers/i18n',
    'helpers/device-master',
    'app/constants/device-constants',
    'app/actions/beambox/preview-mode-controller',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/contexts/ProgressCaller',
], function(
    $,
    i18n,
    DeviceMaster,
    DeviceConstants,
    PreviewModeController,
    Alert,
    AlertConstants,
    Progress,
) {

    const lang = i18n.get();

    return function(printer, allowPause, forceAbort) {
        if(!printer) { return; }
        const deferred = $.Deferred();

        const onYes = async (id) => {
            let timer;
            if (PreviewModeController.isPreviewMode()) {
                await PreviewModeController.end();
            }
            await DeviceMaster.selectDevice(printer);
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
                    onNo: () => {deferred.resolve(false)},
                });
                break;
            case DeviceConstants.status.COMPLETED:
            case DeviceConstants.status.ABORTED:
                // quit
                DeviceMaster.selectDevice(printer)
                    .then(() => {
                        DeviceMaster.quit()
                            .then(() => {
                                deferred.resolve('ok');
                            });
                    });
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
                Alert.popUpDeviceBusy('on-select-printer');
                break;
        }

        return deferred.promise();
    };
});
