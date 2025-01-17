import storage from 'implementations/storage';
import { IDeviceInfo } from 'interfaces/IDevice';

export default (devices: { [key: string]: IDeviceInfo }): IDeviceInfo[] => {
  const blackList = (storage.get('black-list') as string || '').split(',');
  return Object.keys(devices)
    .filter((o) => !blackList.includes(devices[o].name))
    .map((p) => devices[p]);
};
