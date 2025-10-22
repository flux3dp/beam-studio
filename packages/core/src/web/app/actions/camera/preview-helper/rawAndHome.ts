import progressCaller from '@core/app/actions/progress-caller';
import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import versionChecker from '@core/helpers/version-checker';

const PROGRESS_ID = 'raw-and-home';

const rawAndHome = async (progressId?: string): Promise<void> => {
  const { lang } = i18n;
  const version = deviceMaster.currentDevice!.info.version;
  const checker = versionChecker(version);

  if (!progressId) {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID });
  }

  if (deviceMaster.currentControlMode !== 'raw') {
    progressCaller.update(progressId || PROGRESS_ID, { message: lang.message.enteringRawMode });
    await deviceMaster.enterRawMode();
  }

  const rotaryMode = useDocumentStore.getState()['rotary_mode'];

  progressCaller.update('preview-mode-controller', { message: lang.message.homing });

  if (rotaryMode) {
    await deviceMaster.rawHomeZ();
  }

  if (checker.meetRequirement('H_CAM_COMMAND')) await deviceMaster.rawHomeCamera();
  else await deviceMaster.rawHome();

  if (rotaryMode) {
    await deviceMaster.rawMoveZRelToLastHome(0);
  }

  await deviceMaster.rawLooseMotor();

  if (!progressId) {
    progressCaller.popById(PROGRESS_ID);
  }
};

export default rawAndHome;
