import { selectStlObject } from '@core/app/components/beambox/InnerEngraving/utils/selection';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import readBitmapFile from '@core/app/svgedit/operations/import/readBitmapFile';
import { initializePhotoPlane } from '@core/app/svgedit/stl/photoPlane';
import { syncStlObjectsWithDom } from '@core/app/svgedit/stl/sync';

const importPhotoPlane = async (file: File): Promise<void> => {
  const command = new history.BatchCommand('Import 3D Photo');
  const elem = await readBitmapFile(file, { parentCmd: command });
  const object = initializePhotoPlane(elem);

  command.onAfter = () => syncStlObjectsWithDom([object]);
  undoManager.addCommandToHistory(command);
  selectStlObject(elem.id);
};

export default importPhotoPlane;
