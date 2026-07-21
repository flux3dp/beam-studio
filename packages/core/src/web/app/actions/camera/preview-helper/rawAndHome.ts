import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';

import callWithRetry from './callWithRetry';

const rawAndHome = async (updateMessage?: (message: string) => void): Promise<void> => {
  const { lang } = i18n;

  if (deviceMaster.currentControlMode !== 'raw') {
    updateMessage?.(lang.message.enteringRawMode);
    await callWithRetry(() => deviceMaster.enterRawMode());
  }

  const rotaryMode = useDocumentStore.getState()['rotary_mode'];

  updateMessage?.(lang.message.homing);

  if (rotaryMode) {
    await callWithRetry(() => deviceMaster.rawHomeZ());
  }

  await callWithRetry(() => deviceMaster.rawHomeCamera());

  if (rotaryMode) {
    await callWithRetry(() => deviceMaster.rawMoveZRelToLastHome(0));
  }

  await callWithRetry(() => deviceMaster.rawLooseMotor());
};

export default rawAndHome;
