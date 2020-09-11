/**
 * firmware updater
 */
import * as i18n from './i18n';
import DeviceMaster from './device-master';
import Alert from '../app/contexts/AlertCaller';
import AlertConstants from '../app/constants/alert-constants';
import AlertActions from '../app/actions/alert-actions';
import Progress from '../app/contexts/ProgressCaller';
import ProgressActions from '../app/actions/progress-actions';
import ProgressConstants from '../app/constants/progress-constants';
import InputLightboxActions from '../app/actions/input-lightbox-actions';
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

    _uploadToDevice = (file) => {
        DeviceMaster.selectDevice(printer).then(function() {
        Progress.openSteppingProgress({id: 'update-firmware', message: ''});
            doUpdate(file).progress((r) => {
                r.percentage = Number(r.percentage || 0).toFixed(2);
                Progress.update('update-firmware', {
                message: lang.update.updating + ' (' + r.percentage + '%)',
                percentage: r.percentage
            });
            }).always(() => {
                Progress.popById('update-firmware');
            }).done(
                _onFinishUpdate.bind(null, true)
            ).fail(
                _onFinishUpdate.bind(null, false)
            );
        });
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
        let name = 'upload-firmware',
            content;

        content = {
            type: InputLightboxConstants.TYPE_FILE,
            caption: lang.update.firmware.upload_file,
            onSubmit: onSubmit,
            onClose: function() {
                if ('toolhead' === type) {
                    DeviceMaster.quitTask();
                }
            },
            confirmText: lang.update.firmware.confirm
        };

        InputLightboxActions.open( name, content );
    };

    onSubmit = function(files, e) {
        let file = files.item(0),
            onFinishUpdate;

        DeviceMaster.selectDevice(printer).then(function() {
            Progress.openSteppingProgress({id: 'update-firmware', message: ''});
            doUpdate(file).progress((r) => {
                r.percentage = Math.round(r.percentage * 100) / 100;
                Progress.update('update-firmware', {
                    message: lang.update.updating + ' (' + r.percentage + '%)',
                    percentage: r.percentage
                });
            }).always(() => {
                Progress.popById('update-firmware');
            }).done(
                _onFinishUpdate.bind(null, true)
            ).fail(
                _onFinishUpdate.bind(null, false)
            );
        });
    };

    const quitTask = () => {
        console.log('quitting task');
        DeviceMaster.quitTask().then(r => {
            console.log('task quitted?', r);
            if(r.error) {
                setTimeout(() => {
                    quitTask();
                }, 2000);
            };
        }).fail(e => {
            console.log('error from quit task', e);
            setTimeout(() => {
                quitTask();
            }, 2000);
        });
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
