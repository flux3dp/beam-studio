define([
    'helpers/i18n',
    'helpers/api/config',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/contexts/ProgressCaller'
],function(
    i18n,
    Config,
    Alert,
    AlertConstants,
    Progress
){
    'use strict';

    const LANG = i18n.lang.beambox;
    return {
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
            Progress.openNonstopProgress({id: 'upload-to-aws', message: LANG.popup.progress.uploading});

            try {
                let report_file = new Blob([body], {type: 'application/octet-stream'});
                report_file.lastModifiedDate = new Date();
                report_file.name = `${Math.floor(Date.now() / 1000)}-${fileName}-${process.platform}-v${window.FLUX.version}-${fileName}`;

                const uploadFormData = new FormData();
                uploadFormData.append('file', report_file);
                uploadFormData.append('Content-Type', report_file.type);
                uploadFormData.append('acl', 'bucket-owner-full-control');
                uploadFormData.append('key', `svg&bvg/${report_file.name}`);

                const url = `https://beamstudio-bug-report.s3.amazonaws.com/svg&bvg/${report_file.name}`;
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
});
