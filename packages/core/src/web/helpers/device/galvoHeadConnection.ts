import { galvoDevDefaults } from '@core/app/constants/galvo-dev-settings';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import storage from '@core/implementations/storage';

import deviceMaster from '../device-master';

import { isGalvoHeadMachine } from './gantryTravelRange';

/**
 * Whether one of the parked heads is connected to the gantry (串聯), from the two limit switches the
 * machine reports. Connecting and disconnecting (解聯) are mechanical actions of tens of seconds --
 * home, move to the parking position, home again -- so neither happens as a side effect.
 *
 * What the switches cannot say is *which* head: control_task accepts the same
 * `cut_limit == 0 && galvo_limit == 1` for both galvo_mode and mopa_mode, and laser_select (bit 2)
 * is published only in the Beambox II report -- where it would still not separate them, since
 * mopa_mode selects the STM laser exactly as default_mode does. Any speed derived from this has to
 * suit whichever head is the more demanding.
 */
export type GalvoHeadConnection = 'connected' | 'disconnected' | 'unknown';

/**
 * mm/min the gantry may travel with a galvo head connected to it: galvo_ts, the same speed the
 * exporter moves the gantry at between galvo blocks, for the same reason -- the module is heavy.
 * One number for both heads, since the switches cannot say which one is connected.
 */
export const getGalvoHeadConnectedFeedrate = (): number =>
  storage.get('galvo-dev-settings')?.galvo_ts ?? galvoDevDefaults.galvo_ts;

export const getGalvoHeadConnection = async (model: WorkAreaModel): Promise<GalvoHeadConnection> => {
  if (!isGalvoHeadMachine(model)) return 'disconnected';

  try {
    // deviceinfo is refused in every sub task mode, so ask before the caller enters raw mode.
    if (deviceMaster.currentControlMode !== '') await deviceMaster.endSubTask();

    const { cut_limit: cut, galvo_limit: galvo } = await deviceMaster.getDeviceDetailInfo();

    if (cut === undefined || galvo === undefined) return 'unknown';

    // The machine's own two tests, from control_task's mode handlers. Every other combination is
    // one it does not trust either, and answers by running the whole connect sequence again.
    if (Number(cut) === 1 && Number(galvo) === 0) return 'disconnected';

    if (Number(cut) === 0 && Number(galvo) === 1) return 'connected';

    return 'unknown';
  } catch (error) {
    console.error('Failed to read the galvo head connection', error);

    return 'unknown';
  }
};

/**
 * The feedrate cap a connected head puts on gantry moves, or undefined when there is none.
 * Clamp with it (`Math.min`) rather than assigning it, so a flow that is already slower stays slow.
 *
 * An unreadable state caps: a connected head at full speed is the expensive way to be wrong.
 */
export const getGalvoGantryFeedrateCap = async (model: WorkAreaModel): Promise<number | undefined> => {
  if (!isGalvoHeadMachine(model)) return undefined;

  return (await getGalvoHeadConnection(model)) === 'disconnected' ? undefined : getGalvoHeadConnectedFeedrate();
};
