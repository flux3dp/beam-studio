import alertCaller from '@core/app/actions/alert-caller';
import { axiosFluxId } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';

import { sha256 } from '../sha';

let cache: null | { latest: boolean; serials: string[] } = null;

const getBlockedSerials = async (): Promise<{ latest: boolean; serials: string[] }> => {
  if (cache) {
    return cache;
  }

  try {
    const { data } = await axiosFluxId.get('/machine/blocked');
    const serials = data.blocked;

    if (serials !== undefined) {
      cache = { latest: true, serials };

      return cache;
    }
  } catch (e) {
    console.error('Error when getting blocked serials', e);
  }
  cache = { latest: false, serials: [] };

  return cache;
};

export async function checkBlockedSerial(serial: string): Promise<boolean> {
  if (Date.now() < new Date('2025/2/3 10:0:0 +8:00').valueOf()) {
    return true;
  }

  const hashedSerial = await sha256(serial);
  const { latest, serials } = await getBlockedSerials();
  const isBlocked = serials.includes(hashedSerial);

  if (!isBlocked) {
    return true;
  }

  alertCaller.popUp({
    caption: i18n.lang.message.device_blocked.caption,
    id: 'device-blocked',
    message: latest ? i18n.lang.message.device_blocked.online : i18n.lang.message.device_blocked.offline,
  });

  return false;
}
