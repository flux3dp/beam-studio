import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { changeMultipleDocumentStoreValues, useDocumentStore } from '@core/app/stores/documentStore';
import { toggleFullColorAfterWorkareaChange } from '@core/helpers/layer/layer-config-helper';
import { regulateEngraveDpiOption } from '@core/helpers/regulateEngraveDpi';
import type { ICommand } from '@core/interfaces/IHistory';

const changeWorkarea = (workarea: WorkAreaModel, opts: { toggleModule?: boolean } = {}): ICommand => {
  const { toggleModule = true } = opts;
  const newEngraveDpi = regulateEngraveDpiOption(workarea, useDocumentStore.getState().engrave_dpi);
  const cmd = changeMultipleDocumentStoreValues({
    engrave_dpi: newEngraveDpi,
    workarea,
  });
  const postWorkareaChange = () => {
    if (toggleModule) toggleFullColorAfterWorkareaChange();
  };

  postWorkareaChange();
  cmd.onAfter = () => postWorkareaChange();

  return cmd;
};

export default changeWorkarea;
