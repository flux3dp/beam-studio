import { pipe, prop } from 'remeda';

import { askForFileTarget } from '@core/app/components/dialogs/FileTargetSelector';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import selectionManager from '@core/app/svgedit/selection';
import { updateRecentFiles } from '@core/helpers/file/recentFiles';
import { getOS } from '@core/helpers/getOS';
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

export const saveAsFile = async (opts: { templateMode?: boolean } = {}): Promise<boolean> => {
  selectionManager.clearSelection();
  svgCanvas.removeUnusedDefs();

  const target = await askForFileTarget(opts.templateMode);

  if (!target) return false;

  if (target === 'cloud') {
    return await saveToCloud(undefined, opts);
  }

  const defaultFileName = getDefaultFileName();
  const langFile = i18n.lang.topmenu.file;
  let blob: Blob | null = null;
  const getContent = async () => {
    blob = pipe(
      await generateBeamBuffer(opts),
      (buffer) => Uint8Array.from(buffer),
      prop('buffer'),
      (arrayBuffer) => new Blob([arrayBuffer]),
    );

    return blob;
  };

  const newFilePath = await dialog.writeFileDialog(
    getContent,
    langFile.save_scene,
    getOS() === 'Linux' ? `${defaultFileName}.beam` : defaultFileName,
    [
      { extensions: ['beam'], name: getOS() === 'MacOS' ? `${langFile.scene_files} (*.beam)` : langFile.scene_files },
      { extensions: ['*'], name: i18n.lang.topmenu.file.all_files },
    ],
  );

  const isWeb_ = isWeb();

  if (newFilePath || isWeb_) {
    if (isWeb_) {
      currentFileManager.setCloudUUID(null);
    } else {
      currentFileManager.setLocalFile(newFilePath!);
      updateRecentFiles(newFilePath!);
    }

    currentFileManager.setTemplateFile(blob, opts?.templateMode !== undefined);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};

export const saveFile = async (): Promise<boolean> => {
  const path = currentFileManager.getPath();

  if (!path || (currentFileManager.isCloudFile && !currentFileManager.isCloudFileEditable)) {
    return await saveAsFile();
  }

  selectionManager.clearSelection();
  svgCanvas.removeUnusedDefs();

  if (currentFileManager.isCloudFile) {
    return saveToCloud(path);
  }

  if (path.endsWith('.bvg')) {
    const revert = await convertVariableText();
    const output = svgCanvas.getSvgString();

    revert?.();
    await fs.writeFile(path, output);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  if (path.endsWith('.beam')) {
    const buffer = await generateBeamBuffer();

    await fs.writeFile(path, buffer);

    const blob = pipe(
      buffer,
      (buffer) => Uint8Array.from(buffer),
      prop('buffer'),
      (arrayBuffer) => new Blob([arrayBuffer]),
    );

    currentFileManager.setTemplateFile(blob);
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};
