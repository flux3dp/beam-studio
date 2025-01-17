/* eslint-disable import/first */
const initSentry = jest.fn();
const captureMessage = jest.fn();
jest.mock('implementations/sentry', () => ({
  initSentry,
  Sentry: {
    captureMessage,
  },
}));

const get = jest.fn();
const set = jest.fn();
jest.mock('implementations/storage', () => ({
  get,
  set,
}));

import { IDeviceInfo } from 'interfaces/IDevice';
import SentryHelper from './sentry-helper';

describe('test sentry-helper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('sentry is not initiated', () => {
    SentryHelper.sendDeviceInfo({} as IDeviceInfo);
    expect(captureMessage).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  test('enable-sentry is false', () => {
    get.mockReturnValue(false);
    SentryHelper.initSentry();
    expect(get).toHaveBeenNthCalledWith(1, 'enable-sentry');
    expect(initSentry).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  test('enable-sentry is true', () => {
    get.mockReturnValue(true);
    SentryHelper.initSentry();
    expect(get).toHaveBeenNthCalledWith(1, 'enable-sentry');
    expect(initSentry).toHaveBeenCalledTimes(1);
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage).toHaveBeenNthCalledWith(1, 'User Census', {
      level: 'info',
      tags: {
        census: 'v1',
        from: 'renderer',
      },
    });
  });

  test('device is never sent', () => {
    SentryHelper.sendDeviceInfo({
      uuid: '12345',
      version: '1.0.0',
      model: 'fbb1b',
    } as IDeviceInfo);
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage).toHaveBeenNthCalledWith(1, 'Device Info', {
      level: 'info',
      tags: {
        'device-lastversion': 'no',
        'device-uuid': '12345',
        'device-version': '1.0.0',
        'device-model': 'fbb1b',
      },
    });
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenNthCalledWith(1, 'sentry-send-devices', {
      12345: '1.0.0',
    });
  });

  test('device has different version', () => {
    SentryHelper.sendDeviceInfo({
      uuid: '12345',
      version: '1.0.1',
      model: 'fbb1b',
    } as IDeviceInfo);
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage).toHaveBeenNthCalledWith(1, 'Device Info', {
      level: 'info',
      tags: {
        'device-lastversion': '1.0.0',
        'device-uuid': '12345',
        'device-version': '1.0.1',
        'device-model': 'fbb1b',
      },
    });
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenNthCalledWith(1, 'sentry-send-devices', {
      12345: '1.0.1',
    });
  });

  test('device has same version', () => {
    SentryHelper.sendDeviceInfo({
      uuid: '12345',
      version: '1.0.1',
      model: 'fbb1b',
    } as IDeviceInfo);
    expect(captureMessage).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
