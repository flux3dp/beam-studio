import beamboxPreferences from '@core/app/actions/beambox/beambox-preference';
import openBottomBoundaryDrawer from '@core/app/actions/beambox/open-bottom-boundary-drawer';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { changeBeamboxPreferenceValue } from '@core/app/svgedit/history/beamboxPreferenceCommand';
import workareaManager from '@core/app/svgedit/workarea';
import { toggleFullColorAfterWorkareaChange } from '@core/helpers/layer/layer-config-helper';
import type { ICommand } from '@core/interfaces/IHistory';

const changeWorkarea = (workarea: WorkAreaModel, opts: { toggleModule?: boolean } = {}): ICommand => {
  const { toggleModule = true } = opts;
  const cmd = changeBeamboxPreferenceValue('workarea', workarea);
  const postWorkareaChange = () => {
    const currentValue = beamboxPreferences.read('workarea');

    workareaManager.setWorkarea(currentValue);
    workareaManager.resetView();

    if (toggleModule) toggleFullColorAfterWorkareaChange();
  };

  postWorkareaChange();
  cmd.onAfter = () => postWorkareaChange();

  return cmd;
};

export default changeWorkarea;
