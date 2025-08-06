// ConnectMachineIp/utils/deviceStorage.ts
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { adorModels, promarkModels } from '@core/app/actions/beambox/constant';
import { workAreaSet } from '@core/app/constants/workarea-constants';
import alertConfig from '@core/helpers/api/alert-config';
import deviceMaster from '@core/helpers/device-master';
import storage from '@core/implementations/storage';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export const saveDeviceAndSettings = async (device: IDeviceInfo): Promise<void> => {
  const deviceModel = workAreaSet.has(device.model) ? device.model : 'fbb1b';

  BeamboxPreference.write('model', deviceModel);
  BeamboxPreference.write('workarea', deviceModel);

  let pokeIPs = storage.get('poke-ip-addr')?.split(/[,;] ?/) || [];

  if (!pokeIPs.includes(device.ipaddr)) {
    if (pokeIPs.length > 19) {
      pokeIPs = pokeIPs.slice(pokeIPs.length - 19, pokeIPs.length);
    }

    pokeIPs.push(device.ipaddr);
    storage.set('poke-ip-addr', pokeIPs.join(','));
  }

  if (!storage.get('printer-is-ready')) {
    storage.set('new-user', true);
  }

  storage.set('printer-is-ready', true);
  storage.set('selected-device', device.uuid);

  if (adorModels.has(device.model) || promarkModels.has(device.model)) {
    alertConfig.write('done-first-cali', true);

    if (promarkModels.has(device.model)) {
      storage.set('last-promark-serial', device.serial);
      await deviceMaster.select(device);
    }
  } else if (device.model === 'fbm1') {
    alertConfig.write('done-first-cali', false);
  }
};
