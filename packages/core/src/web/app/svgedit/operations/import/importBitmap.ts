import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import workareaManager from '@core/app/svgedit/workarea';
import { isInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import { getData } from '@core/helpers/layer/layer-config-helper';

import layerManager from '../../layer/layerManager';

import importPhotoPlane from './importPhotoPlane';
import readBitmapFile from './readBitmapFile';

// TODO: add unit test
const importBitmap = async (file: File): Promise<void> => {
  if (isInnerEngravingActive()) {
    await importPhotoPlane(file);

    return;
  }

  if (modelsWithModules.has(workareaManager.model)) {
    const currentLayer = layerManager.getCurrentLayerElement()!;

    if (printingModules.has(getData(currentLayer, 'module')!) && getData(currentLayer, 'fullcolor')) {
      await readBitmapFile(file, { gray: false });

      return;
    }
  }

  await readBitmapFile(file);
};

export default importBitmap;
