import { pipe, prop } from 'remeda';

import currentFileManager from '@core/app/svgedit/currentFileManager';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { convertVariableText } from '@core/helpers/variableText';
import dialog from '@core/implementations/dialog';
import fs from '@core/implementations/fileSystem';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { generateBeamBuffer } from '../utils/beam';
import { getDefaultFileName } from '../utils/common';

import { saveToCloud } from './cloud';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const saveAsFile = async (): Promise<boolean> => {
  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const defaultFileName = getDefaultFileName();
  const langFile = i18n.lang.topmenu.file;
  const getContent = async () =>
    pipe(
      await generateBeamBuffer(),
      (buffer) => Uint8Array.from(buffer),
      prop('buffer'),
      (arrayBuffer) => new Blob([arrayBuffer]),
    );

  const newFilePath = await dialog.writeFileDialog(
    getContent,
    langFile.save_scene,
    window.os === 'Linux' ? `${defaultFileName}.beam` : defaultFileName,
    [
      { extensions: ['beam'], name: window.os === 'MacOS' ? `${langFile.scene_files} (*.beam)` : langFile.scene_files },
      { extensions: ['*'], name: i18n.lang.topmenu.file.all_files },
    ],
  );

  if (newFilePath) {
    currentFileManager.setLocalFile(newFilePath);
    svgCanvas.updateRecentFiles(newFilePath);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  if (isWeb()) {
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};

export const saveFile = async (): Promise<boolean> => {
  const path = currentFileManager.getPath();

  if (!path) {
    return await saveAsFile();
  }

  svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  if (currentFileManager.isCloudFile) {
    return saveToCloud(path);
  }

  if (path.endsWith('.bvg')) {
    const revert = await convertVariableText();
    const output = svgCanvas.getSvgString();

    revert?.();
    fs.writeFile(path, output);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  if (path.endsWith('.beam')) {
    const buffer = await generateBeamBuffer();

    await fs.writeFile(path, buffer);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};
