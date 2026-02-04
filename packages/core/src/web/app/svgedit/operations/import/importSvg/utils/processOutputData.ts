import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { getDefaultLaserModule } from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import fileSystem from '@core/implementations/fileSystem';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { ImportType } from '@core/interfaces/ImportSvg';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import importSvgString from '../../importSvgString';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const getBasename = (path: string) => path.match(/(.+)[/\\].+/)?.[1] ?? '';

function preprocessSvgString(rawSvgString: string, type: ImportType, filePath?: string): string {
  let svgString = rawSvgString;

  if (!['color', 'layer'].includes(type)) {
    svgString = svgString.replace(/<svg[^>]*>/, (svgTagString) =>
      svgTagString.replace(/"([^"]*)pt"/g, (_, valWithoutPt) => `"${valWithoutPt}"`),
    );
  }

  // 'path' is non-standard for Blob.
  // If 'blob' is a File object, 'blob.name' (the filename) might be available.
  // If 'blob.path' is crucial and comes from a specific environment or custom type,
  // For now, we'll keep the logic but isolate it.
  if (filePath) {
    const basePath = getBasename(filePath); // Assuming getBasename is reliable

    svgString = svgString.replace('xlink:href="../', `xlink:href="${basePath}/../`);
    svgString = svgString.replace('xlink:href="./', `xlink:href="${basePath}/`);
  }

  svgString = svgString.replace(/<!\[CDATA\[([^\]]*)\]\]>/g, (_, p1) => p1);
  svgString = svgString.replace(/<switch[^>]*>[^<]*<[^/]*\/switch>/g, () => '');

  if (!['color', 'layer'].includes(type)) {
    svgString = svgString.replace(/<image[^>]*>[^<]*<[^/]*\/image>/g, () => '');
    svgString = svgString.replace(/<image[^>]*>/g, () => '');
  }

  return svgString
    .replace(/fill(: ?#(fff(fff)?|FFF(FFF)?));/g, 'fill: none;')
    .replace(/fill= ?"#(fff(fff)?|FFF(FFF))"/g, 'fill="none"');
}

const readSVG = (
  input: Blob | File,
  {
    layerName,
    parentCmd = undefined,
    targetModule = getDefaultLaserModule(),
    type,
  }: { layerName?: string; parentCmd?: IBatchCommand; targetModule?: LayerModuleType; type: ImportType },
) =>
  new Promise<SVGUseElement[]>((resolve) => {
    const parsedLayerName = layerName === 'nolayer' ? undefined : layerName;
    const reader = new FileReader();

    reader.onloadend = async (e) => {
      const rawSvgString = e.target?.result as string;
      const filePath = fileSystem.getPathForFile(input as File);
      const modifiedSvgString = preprocessSvgString(rawSvgString, type, filePath);

      const newElements = await importSvgString(modifiedSvgString, {
        layerName: parsedLayerName,
        parentCmd,
        targetModule,
        type,
      });

      // Apply style
      svgCanvas.svgToString($('#svgcontent')[0], 0);

      resolve(newElements);
    };

    reader.readAsText(input);
  });

export async function processOutputData(
  outputData: Record<string, Blob> & { bitmapOffset?: [number, number] },
  blob: Blob,
  elementOptions: { parentCmd: IBatchCommand; targetModule: LayerModuleType; type: ImportType },
  importType: ImportType,
): Promise<SVGUseElement[]> {
  const newElements: SVGUseElement[] = [];

  if (['color', 'nolayer'].includes(importType)) {
    if (outputData.strokes) newElements.push(...(await readSVG(outputData.strokes, elementOptions)));

    if (outputData.colors) newElements.push(...(await readSVG(outputData.colors, elementOptions)));
  } else if (importType === 'layer') {
    const keys = Object.keys(outputData).filter((key) => !['bitmap', 'bitmapOffset'].includes(key));

    for (const layerName of keys) {
      if (outputData[layerName]) {
        newElements.push(...(await readSVG(outputData[layerName], { ...elementOptions, layerName })));
      }
    }
  } else {
    // Fallback for other types, or perhaps this branch is never hit if importType is validated
    newElements.push(...(await readSVG(blob, elementOptions)));
  }

  return newElements.filter(Boolean); // Filter out any null/undefined results from readSVG
}
