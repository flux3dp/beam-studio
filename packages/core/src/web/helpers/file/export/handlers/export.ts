import jsPDF from 'jspdf';
import { filter, map, pipe } from 'remeda';
import { match } from 'ts-pattern';

import Progress from '@core/app/actions/progress-caller';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import workareaManager from '@core/app/svgedit/workarea';
import { convertAllTextToPath } from '@core/helpers/convertToPath';
import i18n from '@core/helpers/i18n';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayerNames, getLayerElementByName } from '@core/helpers/layer/layer-helper';
import { layersToA4Base64 } from '@core/helpers/layer/layersToA4Base64';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMac } from '@core/helpers/system-helper';
import { convertVariableText } from '@core/helpers/variableText';
import dialog from '@core/implementations/dialog';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getDefaultFileName, switchSymbolWrapper } from '../utils/common';
import { checkNounProjectElements, removeNPElementsWrapper } from '../utils/nounProject';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const exportAsBVG = async (): Promise<boolean> => {
  if (!(await checkNounProjectElements())) {
    return false;
  }

  svgCanvas.clearSelection();

  const defaultFileName = getDefaultFileName();
  const langFile = i18n.lang.topmenu.file;

  svgCanvas.removeUnusedDefs();

  const getContent = () =>
    removeNPElementsWrapper(() =>
      switchSymbolWrapper(async () => {
        const revert = await convertVariableText();
        const content = svgCanvas.getSvgString();

        revert?.();

        return content;
      }),
    );
  const newFilePath = await dialog.writeFileDialog(getContent, langFile.save_scene, defaultFileName, [
    { extensions: ['bvg'], name: isMac() ? `${langFile.scene_files} (*.bvg)` : langFile.scene_files },
    { extensions: ['*'], name: langFile.all_files },
  ]);

  if (newFilePath) {
    currentFileManager.setLocalFile(newFilePath);
    svgCanvas.updateRecentFiles(newFilePath);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};

export const exportAsSVG = async (): Promise<void> => {
  if (!(await checkNounProjectElements())) {
    return;
  }

  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const getContent = async () => {
    const reverts = [await convertVariableText(), (await convertAllTextToPath()).revert];
    const allLayers = document.querySelectorAll('g.layer');

    allLayers.forEach((layer) => layer.removeAttribute('clip-path'));

    const res = removeNPElementsWrapper(() => switchSymbolWrapper(() => svgCanvas.getSvgString({ unit: 'mm' })));

    allLayers.forEach((layer) => layer.setAttribute('clip-path', 'url(#scene_mask)'));
    reverts.toReversed().forEach((revert) => revert?.());

    return res;
  };
  const defaultFileName = getDefaultFileName();
  const langFile = i18n.lang.topmenu.file;

  await dialog.writeFileDialog(getContent, langFile.save_svg, defaultFileName, [
    { extensions: ['svg'], name: isMac() ? `${langFile.svg_files} (*.svg)` : langFile.svg_files },
    { extensions: ['*'], name: langFile.all_files },
  ]);
};

export const exportAsImage = async (type: 'jpg' | 'png'): Promise<void> => {
  const langFile = i18n.lang.topmenu.file;

  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const getContent = async () => {
    const reverts = [await convertVariableText(), (await convertAllTextToPath()).revert];
    const output = switchSymbolWrapper(() => svgCanvas.getSvgString());

    reverts.toReversed().forEach((revert) => revert?.());
    Progress.openNonstopProgress({ id: 'export_image', message: langFile.converting });

    const { height, width } = workareaManager;
    const canvas = await svgStringToCanvas(output, width, height);
    const base64 = match(type)
      .with('png', () =>
        pipe(canvas.toDataURL('image/png'), (base64) => base64.replace(/^data:image\/\w+;base64,/, '')),
      )
      .with('jpg', () => {
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        return pipe(canvas.toDataURL('image/jpeg', 1.0), (base64) => base64.replace(/^data:image\/\w+;base64,/, ''));
      })
      .exhaustive();

    return new Blob([Buffer.from(base64, 'base64') as unknown as Blob]);
  };
  const defaultFileName = getDefaultFileName();
  const fileTypeName = `${langFile[`${type}_files`]}`;

  try {
    await dialog.writeFileDialog(getContent, langFile[`save_${type}`], defaultFileName, [
      { extensions: [type], name: isMac() ? `${fileTypeName} (*.${type})` : fileTypeName },
      { extensions: ['*'], name: langFile.all_files },
    ]);
  } finally {
    Progress.popById('export_image');
  }
};

export const exportUvPrintAsPdf = async (): Promise<void> => {
  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const {
    topmenu: { file: lang },
  } = i18n.lang;
  const reverts = [await convertVariableText(), (await convertAllTextToPath()).revert];
  const layers = pipe(
    getAllLayerNames(),
    filter((layerName) => getData(getLayerElementByName(layerName), 'module') === LayerModule.UV_PRINT),
    map(getLayerElementByName),
  ) as SVGGElement[];
  const base64 = await switchSymbolWrapper(() => layersToA4Base64(layers));
  const defaultFileName = getDefaultFileName();

  reverts.toReversed().forEach((revert) => revert?.());

  const pdf = new jsPDF().addImage(base64, 'PNG', 0, 0, 210, 297);
  const getContent = () => new Blob([pdf.output('blob')], { type: 'application/pdf' });

  await dialog.writeFileDialog(getContent, lang.save_pdf, defaultFileName, [
    { extensions: ['pdf'], name: isMac() ? `PDF (*.pdf)` : 'PDF' },
    { extensions: ['*'], name: lang.all_files },
  ]);
};
