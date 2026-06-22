import { promarkModels } from '@core/app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { showDevMsg, uvModel } from '@core/helpers/is-dev';
import storage from '@core/implementations/storage';
import type { PromarkInfo } from '@core/interfaces/Promark';

import promarkDataStore from './promark-data-store';

const defaultValue: PromarkInfo = {
  laserType: LaserType.Desktop,
  watt: 20,
};

const getFallbackSerial = (): string => storage.get('last-promark-serial') || 'no-serial';

const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');
let messageCache = {
  laserType: null as LaserType | null,
  serial: null as null | string,
  watt: null as null | number,
  workarea: null as null | string,
};

const _getSerial = (): string => {
  const { model, serial } = TopBarController.getSelectedDevice() ?? {};

  if (promarkModels.has(model!)) {
    return serial!;
  }

  return getFallbackSerial();
};

export const getSerial = (): string => {
  const serial = _getSerial();

  if (showDevMsg() && messageCache.serial !== serial) {
    messageCache.serial = serial;
    MessageCaller.openMessage({
      content: `Current Promark Serial: ${serial}`,
      level: MessageLevel.INFO,
    });
  }

  eventEmitter.emit('UPDATE_PROMARK_INFO');

  return serial;
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

const _getPromarkInfo = (): PromarkInfo => {
  const serial = getSerial();
  const workarea = useDocumentStore.getState().workarea;
  const isPromarkUV = workarea === uvModel;

  if (isPromarkUV) {
    return { laserType: LaserType.UV, watt: 5 };
  }

  return promarkDataStore.get(serial, 'info') || defaultValue;
};

export const getPromarkInfo = (): PromarkInfo => {
  const workarea = useDocumentStore.getState().workarea;
  const data = _getPromarkInfo();

  if (
    showDevMsg() &&
    (messageCache.laserType !== data.laserType || messageCache.watt !== data.watt || messageCache.workarea !== workarea)
  ) {
    messageCache.laserType = data.laserType;
    messageCache.watt = data.watt;
    messageCache.workarea = workarea;

    MessageCaller.openMessage({
      content: `Current Promark Info: Laser Type - ${LaserType[data.laserType]}, Watt - ${data.watt}, Workarea - ${workarea}`,
      level: MessageLevel.INFO,
    });
  }

  eventEmitter.emit('UPDATE_PROMARK_INFO');

  return data;
};

export const setPromarkInfo = (info: PromarkInfo): void => {
  const serial = getSerial();

  if (serial) {
    if (showDevMsg()) {
      MessageCaller.openMessage({
        content: `Promark info updated. Serial: ${serial}. Data: ${JSON.stringify(info)}`,
        level: MessageLevel.INFO,
      });
    }

    promarkDataStore.set(serial, 'info', info);
    eventEmitterFactory.createEventEmitter('canvas').emit('promark-info-changed', info);
  }

  eventEmitter.emit('UPDATE_PROMARK_INFO');
};

export default {
  getPromarkInfo,
  setPromarkInfo,
};
