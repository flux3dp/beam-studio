import { promarkModels } from '@core/app/actions/beambox/constant';
import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import storage from '@core/implementations/storage';
import type { PromarkInfo } from '@core/interfaces/Promark';

import promarkDataStore from './promark-data-store';

const defaultValue: PromarkInfo = {
  laserType: LaserType.Desktop,
  watt: 20,
};

const getFallbackSerial = (): string => storage.get('last-promark-serial') || 'no-serial';

export const getSerial = (): string => {
  const { model, serial } = TopBarController.getSelectedDevice() ?? {};

  if (promarkModels.has(model!)) {
    return serial!;
  }

  return getFallbackSerial();
};

/**
 * Init info of a newly connected promark by inheriting the info of 'last-promark-serial',
 * or of the 'no-serial' entry written during machine setup. Does nothing if the serial already has info.
 * Call before setting 'last-promark-serial' to storage
 * @param serial promark serial number
 * @returns void
 */
export const initPromarkInfo = (serial: string): void => {
  if (promarkDataStore.get(serial, 'info')) return;

  promarkDataStore.set(serial, 'info', promarkDataStore.get(getFallbackSerial(), 'info') || defaultValue);
};

export const getPromarkInfo = (): PromarkInfo => {
  const serial = getSerial();
  const workarea = useDocumentStore.getState().workarea;
  const isPromarkUV = workarea === 'fuv1';

  if (isPromarkUV) {
    return { laserType: LaserType.UV, watt: 5 };
  }

  return promarkDataStore.get(serial, 'info') || defaultValue;
};

export const setPromarkInfo = (info: PromarkInfo): void => {
  const serial = getSerial();

  if (serial) {
    promarkDataStore.set(serial, 'info', info);
    eventEmitterFactory.createEventEmitter('canvas').emit('promark-info-changed', info);
  }
};

export default {
  getPromarkInfo,
  setPromarkInfo,
};
