/**
 * output error log
 */
define([
    'jquery',
    'helpers/i18n',
    'html2canvas',
    'helpers/logger',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'plugins/file-saver/file-saver.min'
], function(
    $,
    i18n,
    html2canvas,
    Logger,
    Alert,
    AlertConstants,
    ProgressActions,
    ProgressConstants
) {
    'use strict';

    const LANG = i18n.lang.beambox;
    function obfuse(str){
        var output = [],
            c;

        for (var i in str) {
            if (true === str.hasProperty(i)) {
                c = {'f':'x','l':'u','u':'l','x':'f'}[str[i]];
                output.push(c?c:str[i]);
            }
        }

        return output.join('');
    }

    let getOutput = () => {
        let output = [];
        let _logger = new Logger('websocket'),
            allLog = _logger.getAll(),
            report_info = {
                ws: allLog.websocket || '',
                discoverDeviceList: allLog.discover || '',
                localStorage: {},
                general: allLog.generic || '',
            };

        allLog = null;

        if(electron) {
            let os = require("os");
            output.push('======::os::======\n')
            output.push(`OS: ${os.type()}\nARCH: ${os.arch()}\nRELEASE: ${os.release()}\n`);
            output.push(`USER-AGENT: ${navigator.userAgent}\n`);
        }

        output.push('\n\n======::devices::======\n');
        output.push(JSON.stringify(report_info.discoverDeviceList, null, 2))

        if(FLUX.logfile) {
            let fs = require("fs");
            try {
                let buf = fs.readFileSync(FLUX.logfile, {encoding: "utf8"})
                output.push('\n\n======::backend::======\n');
                output.push(buf)
            } catch(err) {
                output.push('\n\n======::backend::======\n');
                output.push(`Open backend log failed: ${err}\n`);
            }
        } else {
            output.push('\n\n======::backend::======\nNot available\n');
        }

        output.push('\n\n======::ws::======\n');
        output.push(JSON.stringify(report_info.ws, null, 2))

        output.push('\n\n======::storage::======\n');

        for(let key in localStorage) {
            let value = localStorage[key];
            if(typeof value == "string" && value.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")) {
                value = "[hidden]";
            }
            if (typeof value == "function") continue;
            output.push(`${key}=${value}\n\n`);
        }

        output.push('\n\n======::generic::======\n');
        output.push(JSON.stringify(report_info.generic, null, 2));

        return output;
    }

    return {
        downloadErrorLog: function() {
            var $deferred = $.Deferred();

            console.log("Outputing");
            html2canvas(window.document.body).then(function(canvas) {
                var jpegUrl = canvas.toDataURL('image/jpeg');
                let report_blob;

                let output = getOutput();
                

                report_blob = new Blob(output, {type: 'text/html'});
                saveAs(report_blob, 'bugreport_' + Math.floor(Date.now() / 1000) + '.txt');

                $deferred.resolve();
            });

            return $deferred.promise();
        },
        uploadBackendErrorLog: async () => {
            ProgressActions.open(ProgressConstants.NONSTOP, LANG.popup.progress.uploading);
            let output = getOutput();
            let report_file = new Blob(output, {type: 'application/octet-stream'});
            report_file.lastModifiedDate = new Date();
            report_file.name = `bugreport_${Math.floor(Date.now() / 1000)}_${process.platform}_${FLUX.version}.log`;
            const uploadFormData = new FormData();
            uploadFormData.append('file', report_file);
            uploadFormData.append('Content-Type', report_file.type);
            uploadFormData.append('acl', 'bucket-owner-full-control');
            uploadFormData.append('key', `backend/${report_file.name}`);

            const url = `https://beamstudio-bug-report.s3.amazonaws.com/backend/${report_file.name}`;
            const config = {
                method: "PUT",
                headers: new Headers({
                    "Accept": 'application/xml',
                    'Content-Type': 'multipart/form-data'
                  }),
                body: uploadFormData,
            };
            try {
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
                ProgressActions.close();
            }
        }
    };
});
