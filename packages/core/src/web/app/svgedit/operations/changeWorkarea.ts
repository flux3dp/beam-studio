import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { changeDocumentStoreValue } from '@core/app/stores/documentStore';
import { toggleFullColorAfterWorkareaChange } from '@core/helpers/layer/layer-config-helper';
import type { ICommand } from '@core/interfaces/IHistory';

const changeWorkarea = (workarea: WorkAreaModel, opts: { toggleModule?: boolean } = {}): ICommand => {
  const { toggleModule = true } = opts;
  const cmd = changeDocumentStoreValue('workarea', workarea);
  const postWorkareaChange = () => {
    if (toggleModule) toggleFullColorAfterWorkareaChange();
  };

  postWorkareaChange();
  cmd.onAfter = () => postWorkareaChange();

  return cmd;
};

export default changeWorkarea;
