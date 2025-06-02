import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import { initLayerConfig, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer, removeDefaultLayerIfEmpty } from '@core/helpers/layer/layer-helper';
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
      const { cmd, layer, name } = createLayer(layerName);

      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

      initLayerConfig(name);

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
    const cmd = removeDefaultLayerIfEmpty();

    if (cmd) batchCmd.addSubCommand(cmd);

    return imageElement;
  }

  return null;
}
