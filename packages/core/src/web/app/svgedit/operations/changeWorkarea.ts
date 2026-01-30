import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { changeDocumentStoreValue } from '@core/app/stores/documentStore';
import history from '@core/app/svgedit/history/history';
import { toggleFullColorAfterWorkareaChange } from '@core/helpers/layer/layer-config-helper';
import { regulateAllLayersDpi } from '@core/helpers/layer/regulateAllLayersDpi';
import type { ICommand } from '@core/interfaces/IHistory';

export const changeWorkarea = (workarea: WorkAreaModel, opts: { toggleModule?: boolean } = {}): ICommand => {
  const { toggleModule = true } = opts;
  const cmd = new history.BatchCommand('Change Workarea');

  cmd.addSubCommand(changeDocumentStoreValue('workarea', workarea));

  regulateAllLayersDpi(workarea, { parentCmd: cmd });

  const postWorkareaChange = () => {
    if (toggleModule) toggleFullColorAfterWorkareaChange();
  };

  postWorkareaChange();
  cmd.onAfter = () => postWorkareaChange();

  return cmd;
};

export default changeWorkarea;
