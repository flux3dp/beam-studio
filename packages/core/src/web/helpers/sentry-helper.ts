import type { IDeviceInfo } from '@core/interfaces/IDevice';

import sentry from '@app/implementations/sentry';
import storage from '@app/implementations/storage';

let isSentryInited = false;
const sendDevices: { [uuid: string]: string } = storage.get('sentry-send-devices') || {};
const { Sentry } = sentry;

const initSentry = (): void => {
  if (storage.get('enable-sentry')) {
    console.log('Sentry Initiated');
    sentry.initSentry();
    isSentryInited = true;
    Sentry.captureMessage('User Census', {
      level: 'info',
      tags: {
        census: 'v1',
        from: 'renderer',
      },
    });
  }
};

const captureMessage = (
  lastVersion: string,
  uuid: string,
  version: string,
  model: string,
): void => {
  Sentry.captureMessage('Device Info', {
    level: 'info',
    tags: {
      'device-lastversion': lastVersion,
      'device-model': model,
      'device-uuid': uuid,
      'device-version': version,
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
