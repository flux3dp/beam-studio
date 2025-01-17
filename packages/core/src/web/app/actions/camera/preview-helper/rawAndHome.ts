import beamboxPreference from 'app/actions/beambox/beambox-preference';
import deviceMaster from 'helpers/device-master';
import i18n from 'helpers/i18n';
import progressCaller from 'app/actions/progress-caller';

const PROGRESS_ID = 'raw-and-home';

const rawAndHome = async (progressId?: string): Promise<void> => {
  const { lang } = i18n;
  if (!progressId) progressCaller.openNonstopProgress({ id: PROGRESS_ID });
  progressCaller.update(progressId || PROGRESS_ID, { message: lang.message.enteringRawMode });
  await deviceMaster.enterRawMode();
  progressCaller.update('preview-mode-controller', { message: lang.message.exitingRotaryMode });
  await deviceMaster.rawSetRotary(false);
  const rotaryMode = beamboxPreference.read('rotary_mode');
  progressCaller.update('preview-mode-controller', { message: lang.message.homing });
  if (rotaryMode) await deviceMaster.rawHomeZ();
  await deviceMaster.rawHome();
  if (rotaryMode) await deviceMaster.rawMoveZRelToLastHome(0);
  await deviceMaster.rawLooseMotor();
  if (!progressId) progressCaller.popById(PROGRESS_ID);
};

export default rawAndHome;
