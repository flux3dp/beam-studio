/**
 * firmware updater
 */
import * as i18n from './i18n';
import DeviceMaster from './device-master';
import Alert from '../app/actions/alert-caller';
import AlertConstants from '../app/constants/alert-constants';
import AlertActions from '../app/actions/alert-actions';
import Dialog from '../app/actions/dialog-caller';
import Progress from '../app/actions/progress-caller';
import InputLightboxConstants from '../app/constants/input-lightbox-constants';


export default function(response, printer, type: string, forceUpdate?: boolean) {
    var lang = i18n.lang,
        doUpdate,
        onDownload,
        onInstall,
        onSubmit,
        _uploadToDevice,
        _onFinishUpdate;

    doUpdate = ( 'firmware' === type ? DeviceMaster.updateFirmware : DeviceMaster.updateToolhead );

    _uploadToDevice = async (file) => {
        const res = await DeviceMaster.select(printer);
        if (res.success) {
            Progress.openSteppingProgress({id: 'update-firmware', message: lang.update.updating + ' (0%)'});
            try {
                await doUpdate(file, (r) => {
                    r.percentage = Number(r.percentage || 0).toFixed(2);
                    Progress.update('update-firmware', {
                        message: lang.update.updating + ' (' + r.percentage + '%)',
                        percentage: r.percentage
                    });
                });
                _onFinishUpdate.bind(null, true);
            } catch (error) {
                _onFinishUpdate.bind(null, false);
            }
            Progress.popById('update-firmware');
        }
    }

    _onFinishUpdate = (isSuccess) => {
        console.log('finished update', isSuccess, type);
        if(type === 'toolhead') {
            quitTask();
        }

        if (true === isSuccess) {
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_INFO,
                message: lang.update.firmware.update_success
            });
        }
        else {
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: lang.update.firmware.update_fail
            });
        }
    };

    onDownload = () => {
        let req = new XMLHttpRequest();

        // get firmware from flux3dp website.
        req.open("GET", response.downloadUrl, true);
        req.responseType = "blob";

        req.onload = function (event) {
            if (this.status == 200) {
                let file = req.response;
                _uploadToDevice(file);
            } else {
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: lang.update.cannot_reach_internet
            });
            }
        };
        req.send();

    };

    onInstall = () => {
        Dialog.showInputLightbox('upload-firmware', {
            type: InputLightboxConstants.TYPE_FILE,
            caption: lang.update.firmware.upload_file,
            confirmText: lang.update.firmware.confirm,
            onSubmit: onSubmit,
            onCancel: function() {
                if ('toolhead' === type) {
                    DeviceMaster.quitTask();
                }
            },
        });
    };

    onSubmit = async function(files, e) {
        let file = files.item(0),
            onFinishUpdate;
        const res = await DeviceMaster.select(printer);
        if (res.success) {
            Progress.openSteppingProgress({id: 'update-firmware', message: lang.update.updating + ' (0%)'});
            try {
                await doUpdate(file, (r) => {
                    r.percentage = Number(r.percentage || 0).toFixed(2);
                    Progress.update('update-firmware', {
                        message: lang.update.updating + ' (' + r.percentage + '%)',
                        percentage: r.percentage
                    });
                });
                _onFinishUpdate.bind(null, true);
            } catch (error) {
                _onFinishUpdate.bind(null, false);
            }
            Progress.popById('update-firmware');
        }
    };

    const quitTask = async () => {
        console.log('quitting task');
        try {
            const r = await DeviceMaster.quitTask();
            console.log('task quitted?', r);
            if (r.error) {
                setTimeout(() => {
                    quitTask();
                }, 2000);
            }
        } catch (e) {
            console.log('error from quit task', e);
            setTimeout(() => {
                quitTask();
            }, 2000);
        }
    };

    if (forceUpdate) {
        onInstall();
    } else {
        AlertActions.showUpdate(
            printer,
            type,
            response || {},
            onDownload,
            onInstall
        );
    }
}
