import type { IDeviceInfo } from '@core/interfaces/IDevice';

export interface ICustomMenuActionProvider {
  getCustomMenuActions: () => { [key: string]: (deivce?: IDeviceInfo) => void };
}
