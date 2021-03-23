import storage from './storage-helper';
import { IDeviceInfo } from '../interfaces/IDevice';

export default function(devices: { [key: string] : IDeviceInfo }) {
    let blackList = (storage.get('black-list') as string || '').split(',');
    return Object.keys(devices)
                 .filter(o => !blackList.includes(devices[o].name))
                 .map((p) => devices[p]);
};
