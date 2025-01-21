import beamboxPreferences from '@core/app/actions/beambox/beambox-preference';
import openBottomBoundaryDrawer from '@core/app/actions/beambox/open-bottom-boundary-drawer';
import workareaManager from '@core/app/svgedit/workarea';
import { changeBeamboxPreferenceValue } from '@core/app/svgedit/history/beamboxPreferenceCommand';
import { ICommand } from '@core/interfaces/IHistory';
import { toggleFullColorAfterWorkareaChange } from '@core/helpers/layer/layer-config-helper';
import { WorkAreaModel } from '@core/app/constants/workarea-constants';

const changeWorkarea = (
  workarea: WorkAreaModel,
  opts: { toggleModule?: boolean } = {},
): ICommand => {
  const { toggleModule = true } = opts;
  const cmd = changeBeamboxPreferenceValue('workarea', workarea);
  const postWorkareaChange = () => {
    const currentValue = beamboxPreferences.read('workarea');
    workareaManager.setWorkarea(currentValue);
    workareaManager.resetView();
    openBottomBoundaryDrawer.update();
    if (toggleModule) toggleFullColorAfterWorkareaChange();
  };
  postWorkareaChange();
  cmd.onAfter = () => postWorkareaChange();
  return cmd;
};

export default changeWorkarea;
