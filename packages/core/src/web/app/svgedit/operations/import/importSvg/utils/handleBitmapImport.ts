import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import { removeDefaultLayerIfEmpty } from '@core/helpers/layer/deleteLayer';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer } from '@core/helpers/layer/layer-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { ILang } from '@core/interfaces/ILang';

import readBitmapFile from '../../readBitmapFile';

export async function handleBitmapImport(
  outputData: Record<string, Blob> & { bitmapOffset?: [number, number] },
  targetModule: LayerModuleType,
  batchCmd: IBatchCommand,
  hasExistingElements: boolean,
  lang: ILang,
): Promise<null | SVGUseElement> {
  if (outputData.bitmap?.size > 0) {
    const isPrinting = printingModules.has(targetModule);

    if (!isPrinting || !hasExistingElements) {
      const layerName = lang.beambox.right_panel.layer_panel.layer_bitmap;
      const { layer } = createLayer(layerName, { initConfig: true, parentCmd: batchCmd });

      if (isPrinting) {
        writeDataLayer(layer, 'module', targetModule);
        writeDataLayer(layer, 'fullcolor', true);
      }
    }

    const imageElement = await readBitmapFile(outputData.bitmap, {
      gray: !isPrinting,
      offset: outputData.bitmapOffset,
      parentCmd: batchCmd,
    });

    removeDefaultLayerIfEmpty({ parentCmd: batchCmd });

    return imageElement;
  }

  return null;
}
