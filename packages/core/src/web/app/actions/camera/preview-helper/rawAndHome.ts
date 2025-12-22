import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import versionChecker from '@core/helpers/version-checker';

const rawAndHome = async (updateMessage?: (message: string) => void): Promise<void> => {
  const { lang } = i18n;
  const version = deviceMaster.currentDevice!.info.version;
  const checker = versionChecker(version);

  if (deviceMaster.currentControlMode !== 'raw') {
    updateMessage?.(lang.message.enteringRawMode);
    await deviceMaster.enterRawMode();
  }

  const rotaryMode = useDocumentStore.getState()['rotary_mode'];

  updateMessage?.(lang.message.homing);

  if (rotaryMode) {
    await deviceMaster.rawHomeZ();
  }

  if (checker.meetRequirement('H_CAM_COMMAND')) await deviceMaster.rawHomeCamera();
  else await deviceMaster.rawHome();

  if (rotaryMode) {
    await deviceMaster.rawMoveZRelToLastHome(0);
  }

  await deviceMaster.rawLooseMotor();
};

export default rawAndHome;
