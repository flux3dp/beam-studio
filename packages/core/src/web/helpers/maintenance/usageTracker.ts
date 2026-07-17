import { DeviceOperationEvents } from '@core/app/constants/deviceEvents';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { machineKeyOf, updateMachineLastUsedAt } from './records';

/**
 * Subscribes to real job starts on the shared `'device'` bus and stamps the machine's
 * `lastUsedAt`, which gates `per_operation` maintenance tasks (honeycomb/chassis cleaning) so
 * they only come due once the machine has actually run since it was last cleaned.
 *
 * Called once from `beambox-init.ts` (mirrors `alertHelper.registerAlertEvents()`).
 */
export const registerMaintenanceUsageTracker = (): void => {
  const deviceEventEmitter = eventEmitterFactory.createEventEmitter('device');

  deviceEventEmitter.on(DeviceOperationEvents.JobStarted, (device: IDeviceInfo) => {
    updateMachineLastUsedAt(machineKeyOf(device));
  });
};
