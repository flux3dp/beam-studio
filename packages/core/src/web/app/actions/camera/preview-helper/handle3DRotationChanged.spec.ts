import { IDeviceInfo } from 'interfaces/IDevice';

import handle3DRotationChanged from './handle3DRotationChanged';


jest.mock('app/constants/device-constants', () => ({
  WORKAREA_DEEP: {
    ado1: 40.5,
    fbb1b: 100,
  },
}));

const mockSet3dRotation = jest.fn();
jest.mock('helpers/device-master', () => ({
  set3dRotation: (...args) => mockSet3dRotation(...args),
}));

const mockDevice = { model: 'ado1' } as IDeviceInfo;

describe('test handle3DRotationChanged', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set 3d rotation to device', async () => {
    await handle3DRotationChanged({ rx: 1, ry: 2, rz: 3, sh: 4, ch: 5, tx: 2, ty: 3, dh: 0 }, 10, mockDevice);
    expect(mockSet3dRotation).toHaveBeenCalledTimes(1);
    expect(mockSet3dRotation).toHaveBeenLastCalledWith({ rx: 1, ry: 2, rz: 3, h: 4 * (30.5 + 5), tx: 2, ty: 3 });
  });
});
