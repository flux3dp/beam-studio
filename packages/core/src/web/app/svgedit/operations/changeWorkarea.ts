import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { changeDocumentStoreValue, useDocumentStore } from '@core/app/stores/documentStore';
import workareaManager from '@core/app/svgedit/workarea';
import { toggleFullColorAfterWorkareaChange } from '@core/helpers/layer/layer-config-helper';
import type { ICommand } from '@core/interfaces/IHistory';

const changeWorkarea = (workarea: WorkAreaModel, opts: { toggleModule?: boolean } = {}): ICommand => {
  const { toggleModule = true } = opts;
  const cmd = changeDocumentStoreValue('workarea', workarea);
  const postWorkareaChange = () => {
    const currentValue = useDocumentStore.getState().workarea;

    workareaManager.setWorkarea(currentValue);
    workareaManager.resetView();

    if (toggleModule) toggleFullColorAfterWorkareaChange();
  };

  postWorkareaChange();
  cmd.onAfter = () => postWorkareaChange();

  return cmd;
};

export default changeWorkarea;
