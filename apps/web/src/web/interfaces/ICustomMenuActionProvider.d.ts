import { IDeviceInfo } from 'interfaces/IDevice';

export interface ICustomMenuActionProvider {
  getCustomMenuActions: () => { [key: string]: ((deivce?: IDeviceInfo) => void) }
}
