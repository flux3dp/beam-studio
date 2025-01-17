import i18n from 'helpers/i18n';
import Alert from '../app/actions/alert-caller';
import AlertConstants from '../app/constants/alert-constants';
import Progress from '../app/actions/progress-caller';

const LANG = i18n.lang.beambox;
export default {
    uploadToS3: async (fileName, body) => {
        if (body.length > 10000000) { // 10M
            setTimeout(() => {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: LANG.popup.upload_file_too_large
                });
            }, 100);
            return;
        }
        Progress.openNonstopProgress({ id: 'upload-to-aws', message: LANG.popup.progress.uploading });

        try {
            const reportFile = new Blob([body], { type: 'application/octet-stream' });
            // reportFile.lastModifiedDate = new Date();
            const reportName = `${Math.floor(Date.now() / 1000)}-${fileName}-${window.os}-v${window['FLUX'].version}-${fileName}`;

            const uploadFormData = new FormData();
            uploadFormData.append('file', reportFile);
            uploadFormData.append('Content-Type', reportFile.type);
            uploadFormData.append('acl', 'bucket-owner-full-control');
            uploadFormData.append('key', `svg&bvg/${reportName}`);

            const url = `https://beamstudio-bug-report.s3.amazonaws.com/svg&bvg/reportName`;
            const config = {
                method: "PUT",
                headers: new Headers({
                    "Accept": 'application/xml',
                    'Content-Type': 'multipart/form-data'
                    }),
                body: uploadFormData,
            };
            let r = await fetch(url, config);
            if (r.status === 200) {
                console.log('Success', r);
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_INFO,
                    message: LANG.popup.successfully_uploaded
                });
            } else {
                console.log('Failed', r);
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: `${LANG.popup.upload_failed}\n${r.status}`
                });
            }
        } catch (e) {
            console.log(e);
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: `${LANG.popup.upload_failed}\n${e}`
            });
        } finally {
            Progress.popById('upload-to-aws');
        }
    }
}
