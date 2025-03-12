/**
 * output error log
 */
import Alert from '@core/app/actions/alert-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';
import Logger from '@core/helpers/logger';
import dialog from '@core/implementations/dialog';
import fs from '@core/implementations/fileSystem';
import os from '@core/implementations/os';
import store from '@core/implementations/storage';
import type { StorageKey } from '@core/interfaces/IStorage';

const LANG = i18n.lang.beambox;

const getOutput = (): string[] => {
  const output = [];
  const logger = Logger('');
  let allLog = logger.getAll();
  const reportInfo = {
    discoverDeviceList: allLog.discover || '',
    general: allLog.generic || '',
    localStorage: {},
    swiftray: allLog.swiftray || '',
    ws: allLog.websocket || '',
  };

  allLog = null;

  if (window.electron) {
    output.push('======::os::======\n');
    output.push(`OS: ${window.os}\nARCH: ${os.arch()}\nRELEASE: ${os.release()}\n`);
    output.push(`USER-AGENT: ${navigator.userAgent}\n`);
  }

  output.push('\n\n======::devices::======\n');
  output.push(JSON.stringify(reportInfo.discoverDeviceList, null, 2));

  if (window.FLUX.logfile) {
    try {
      const buf = fs.readFile(window.FLUX.logfile, 'utf8');

      output.push('\n\n======::backend::======\n');
      output.push(buf);
    } catch (err) {
      output.push('\n\n======::backend::======\n');
      output.push(`Open backend log failed: ${err}\n`);
    }
  } else {
    output.push('\n\n======::backend::======\nNot available\n');
  }

  output.push('\n\n======::ws::======\n');
  output.push(JSON.stringify(reportInfo.ws, null, 2));

  output.push('\n\n======::swiftray::======\n');
  output.push(JSON.stringify(reportInfo.swiftray, null, 2));

  output.push('\n\n======::storage::======\n');

  const keys = Object.keys(store.getStore()) as StorageKey[];

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    let value = store.get(key);

    console.log(key, value);

    if (typeof value === 'string' && value.startsWith('-----BEGIN RSA PRIVATE KEY-----\n')) {
      value = '[hidden]';
    }

    output.push(`${key}=${typeof value === 'object' ? JSON.stringify(value) : value}\n\n`);
  }

  output.push('\n\n======::generic::======\n');
  output.push(JSON.stringify(reportInfo.general, null, 2));

  return output;
};

export default {
  downloadErrorLog: async (): Promise<void> => {
    console.log('Outputing');

    const output = getOutput();
    const fileName = `bugreport_${Math.floor(Date.now() / 1000)}.txt`;
    const getContent = () => output.join('');

    await dialog.writeFileDialog(getContent, LANG.popup.bug_report, fileName, [
      {
        extensions: ['txt'],
        name: window.os === 'MacOS' ? 'txt (*.txt)' : 'txt',
      },
    ]);
  },
  getOutput,
  uploadBackendErrorLog: async (): Promise<void> => {
    Progress.openNonstopProgress({
      id: 'output-error-log',
      message: LANG.popup.progress.uploading,
    });

    const output = getOutput();
    const reportFile = new Blob(output, { type: 'application/octet-stream' });
    // reportFile.lastModifiedDate = new Date();
    const reportName = `bugreport_${Math.floor(Date.now() / 1000)}_${window.os}_${window.FLUX.version}.log`;
    const uploadFormData = new FormData();

    uploadFormData.append('file', reportFile);
    uploadFormData.append('Content-Type', reportFile.type);
    uploadFormData.append('acl', 'bucket-owner-full-control');
    uploadFormData.append('key', `backend/${reportName}`);

    const url = `https://beamstudio-bug-report.s3.amazonaws.com/backend/${reportName}`;
    const config = {
      body: uploadFormData,
      headers: new Headers({
        Accept: 'application/xml',
        'Content-Type': 'multipart/form-data',
      }),
      method: 'PUT',
    };

    try {
      const r = await fetch(url, config);

      if (r.status === 200) {
        console.log('Success', r);
        Alert.popUp({
          message: LANG.popup.successfully_uploaded,
          type: AlertConstants.SHOW_POPUP_INFO,
        });
      } else {
        console.log('Failed', r);
        Alert.popUp({
          message: `${LANG.popup.upload_failed}\n${r.status}`,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
      }
    } catch (e) {
      console.log(e);
      Alert.popUp({
        message: `${LANG.popup.upload_failed}\n${e}`,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    } finally {
      Progress.popById('output-error-log');
    }
  },
};
