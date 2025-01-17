/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { Severity } from '@sentry/types';

import sentry from 'implementations/sentry';
import storage from 'implementations/storage';
import { IDeviceInfo } from 'interfaces/IDevice';

let isSentryInited = false;
const sendDevices: { [uuid: string]: string } = storage.get('sentry-send-devices') || {};
const { Sentry } = sentry;

const initSentry = (): void => {
  if (storage.get('enable-sentry')) {
    console.log('Sentry Initiated');
    sentry.initSentry();
    isSentryInited = true;
    Sentry.captureMessage('User Census', {
      level: 'info' as Severity,
      tags: {
        census: 'v1',
        from: 'renderer',
      },
    });
  }
};

const captureMessage = (
  lastVersion: string, uuid: string, version: string, model: string,
): void => {
  Sentry.captureMessage('Device Info', {
    level: 'info' as Severity,
    tags: {
      'device-lastversion': lastVersion,
      'device-uuid': uuid,
      'device-version': version,
      'device-model': model,
    },
  });
  sendDevices[uuid] = version;
  storage.set('sentry-send-devices', sendDevices);
};

const sendDeviceInfo = (device: IDeviceInfo): void => {
  if (isSentryInited) {
    if (!sendDevices[device.uuid]) {
      captureMessage('no', device.uuid, device.version, device.model);
    } else if (sendDevices[device.uuid] !== device.version) {
      captureMessage(sendDevices[device.uuid], device.uuid, device.version, device.model);
    }
  }
};

export default {
  initSentry,
  sendDeviceInfo,
};
