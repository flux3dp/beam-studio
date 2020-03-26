define([
    'helpers/i18n',
    'helpers/api/config',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/progress-actions',
    'app/constants/progress-constants'
],function(
    i18n,
    Config,
    Alert,
    AlertConstants,
    ProgressActions,
    ProgressConstants
){
    'use strict';

    const LANG = i18n.lang.beambox;
    return {
        uploadToS3: function(fileName, body) {
            if (body.length > 10000000) { // 10M
                setTimeout(() => {
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: LANG.popup.upload_file_too_large
                    });
                }, 100);
                return;   
            }

            ProgressActions.open(ProgressConstants.NONSTOP, LANG.popup.progress.uploading);
            $.ajax({
                url: `https://beamstudio-bug-report.s3.amazonaws.com/${new Date().toString()}-${process.platform}-v${window.FLUX.version}-${fileName}`,
                type: 'PUT',
                contentType: 'text/html; charset=UTF-8',
                data: body,
                success: (data, textStatus, jqXHR) => {
                    ProgressActions.close();
                    console.log(data, textStatus, jqXHR);
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message: LANG.popup.successfully_uploaded
                    });
                },
                error: (jqXHR, textStatus, errorThrown) => {
                    ProgressActions.close();
                    console.log(jqXHR, textStatus, errorThrown);
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: `${LANG.popup.upload_failed}\n${textStatus}: ${errorThrown}`
                    });
                },
                complete: () => {
                }
            });
        }
    }
});
