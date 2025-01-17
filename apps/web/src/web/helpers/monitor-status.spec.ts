import DeviceConstants from 'app/constants/device-constants';
import { IReport } from 'interfaces/IDevice';

import MonitorStatus, { ButtonTypes } from './monitor-status';

jest.mock('helpers/i18n', () => ({
  lang: {
    device: {
      ready: 'Ready',
    },
  },
}));

describe('test monitor-status', () => {
  test('getDisplayStatus', () => {
    expect(MonitorStatus.getDisplayStatus('IDLE')).toBe('Ready');
    expect(MonitorStatus.getDisplayStatus('IDLE1')).toBe('IDLE1');
  });

  test('isAbortedOrCompleted', () => {
    expect(MonitorStatus.isAbortedOrCompleted(null)).toBeFalsy();
    expect(
      MonitorStatus.isAbortedOrCompleted({
        st_id: DeviceConstants.status.ABORTED,
      } as IReport)
    ).toBeTruthy();
    expect(
      MonitorStatus.isAbortedOrCompleted({
        st_id: DeviceConstants.status.COMPLETED,
      } as IReport)
    ).toBeTruthy();
    expect(
      MonitorStatus.isAbortedOrCompleted({
        st_id: DeviceConstants.status.COMPLETING,
      } as IReport)
    ).toBeFalsy();
  });

  test('getControlButtonType', () => {
    expect(MonitorStatus.getControlButtonType(null)).toEqual([]);
    expect(MonitorStatus.getControlButtonType({ st_id: DeviceConstants.status.INIT } as IReport)).toEqual([
      ButtonTypes.DISABLED_PLAY,
    ]);
    expect(MonitorStatus.getControlButtonType({ st_id: DeviceConstants.status.RUNNING } as IReport)).toEqual([
      ButtonTypes.STOP,
      ButtonTypes.PAUSE,
    ]);
  });
});
