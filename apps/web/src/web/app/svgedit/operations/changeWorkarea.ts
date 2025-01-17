import beamboxPreferences from 'app/actions/beambox/beambox-preference';
import openBottomBoundaryDrawer from 'app/actions/beambox/open-bottom-boundary-drawer';
import workareaManager from 'app/svgedit/workarea';
import { changeBeamboxPreferenceValue } from 'app/svgedit/history/beamboxPreferenceCommand';
import { ICommand } from 'interfaces/IHistory';
import { toggleFullColorAfterWorkareaChange } from 'helpers/layer/layer-config-helper';
import { WorkAreaModel } from 'app/constants/workarea-constants';

const changeWorkarea = (workarea: WorkAreaModel, opts: { toggleModule?: boolean } = {}): ICommand => {
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
