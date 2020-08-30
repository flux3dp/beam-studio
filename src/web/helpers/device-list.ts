import * as _localStorage from './local-storage'
import { IDeviceInfo } from '../interfaces/IDevice';

export default function(devices: { [key: string] : IDeviceInfo }) {
    let blackList = (_localStorage.get('black-list') as string || '').split(',');
    return Object.keys(devices)
                 .filter(o => !blackList.includes(devices[o].name))
                 .map((p) => devices[p]);
};