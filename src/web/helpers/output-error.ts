/**
 * output error log
 */
import * as i18n from './i18n';
import Logger from './logger';
import Alert from '../app/actions/alert-caller';
import AlertConstants from '../app/constants/alert-constants';
import ElectronDialogs from '../app/actions/electron-dialogs';
import Progress from '../app/actions/progress-caller';
const Store = requireNode('electron-store');
const store = new Store();

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
    let _logger = Logger('websocket'),
        allLog = _logger.getAll(),
        report_info = {
            ws: allLog.websocket || '',
            discoverDeviceList: allLog.discover || '',
            localStorage: {},
            general: allLog.generic || '',
        };

    allLog = null;

    if(window['electron']) {
        let os = requireNode("os");
        output.push('======::os::======\n')
        output.push(`OS: ${os.type()}\nARCH: ${os.arch()}\nRELEASE: ${os.release()}\n`);
        output.push(`USER-AGENT: ${navigator.userAgent}\n`);
    }

    output.push('\n\n======::devices::======\n');
    output.push(JSON.stringify(report_info.discoverDeviceList, null, 2))

    if(window['FLUX'].logfile) {
        let fs = requireNode("fs");
        try {
            let buf = fs.readFileSync(window['FLUX'].logfile, {encoding: "utf8"})
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

    for(let key in store.store) {
        let value = store.get(key);
        console.log(key, value);
        if(typeof value == "string" && value.startsWith("-----BEGIN RSA PRIVATE KEY-----\n")) {
            value = "[hidden]";
        }
        if (typeof value == "function") continue;
        output.push(`${key}=${typeof(value) === 'object' ? JSON.stringify(value) : value}\n\n`);
    }

    output.push('\n\n======::generic::======\n');
    output.push(JSON.stringify(report_info.general, null, 2));

    return output;
}

export default {
    getOutput,
    downloadErrorLog: async () => {
        console.log('Outputing');

        let output = getOutput();
        const fileName = `bugreport_${Math.floor(Date.now() / 1000)}.txt`;
        const targetFilePath = await ElectronDialogs.saveFileDialog(LANG.popup.bug_report, fileName, [
            {extensionName: 'txt', extensions: ['txt']}
        ], false);

        if (targetFilePath) {
            const fs = requireNode('fs');
            fs.writeFileSync(targetFilePath, output.join(''));
        }
        return;
    },
    uploadBackendErrorLog: async () => {
        Progress.openNonstopProgress({id: 'output-error-log', message: LANG.popup.progress.uploading});
        let output = getOutput();
        let reportFile = new Blob(output, {type: 'application/octet-stream'});
        // reportFile.lastModifiedDate = new Date();
        const reportName = `bugreport_${Math.floor(Date.now() / 1000)}_${process.platform}_${window['FLUX'].version}.log`;
        const uploadFormData = new FormData();
        uploadFormData.append('file', reportFile);
        uploadFormData.append('Content-Type', reportFile.type);
        uploadFormData.append('acl', 'bucket-owner-full-control');
        uploadFormData.append('key', `backend/${reportName}`);

        const url = `https://beamstudio-bug-report.s3.amazonaws.com/backend/${reportName}`;
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
            Progress.popById('output-error-log');
        }
    }
};
