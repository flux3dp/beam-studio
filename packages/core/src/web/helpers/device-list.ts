import storage from '@core/implementations/storage';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export default (devices: { [key: string]: IDeviceInfo }): IDeviceInfo[] => {
  const blackList = ((storage.get('black-list') as string) || '').split(',');

  return Object.keys(devices)
    .filter((o) => !blackList.includes(devices[o].name))
    .map((p) => devices[p]);
};
