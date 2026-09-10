import { pipe, prop } from 'remeda';

import currentFileManager from '@core/app/svgedit/currentFileManager';
import { updateRecentFiles } from '@core/helpers/file/recentFiles';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import dialog from '@core/implementations/dialog';
import fs from '@core/implementations/fileSystem';

import { generateBeamBuffer } from '../utils/beam';
import { getCanvasContent, prepareCanvasContent } from '../utils/canvasContent';
import { getDefaultFileName } from '../utils/fileName';

import { saveToCloud } from './cloud';

export const saveAsFile = async (): Promise<boolean> => {
  if (!(await prepareCanvasContent('beam'))) {
    return false;
  }

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
    getOS() === 'Linux' ? `${defaultFileName}.beam` : defaultFileName,
    [
      { extensions: ['beam'], name: getOS() === 'MacOS' ? `${langFile.scene_files} (*.beam)` : langFile.scene_files },
      { extensions: ['*'], name: i18n.lang.topmenu.file.all_files },
    ],
  );

  if (newFilePath) {
    currentFileManager.setLocalFile(newFilePath);
    updateRecentFiles(newFilePath);
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

  if (currentFileManager.isCloudFile) {
    return saveToCloud(path);
  }

  if (path.endsWith('.bvg')) {
    if (!(await prepareCanvasContent('bvg'))) {
      return false;
    }

    await fs.writeFile(path, await getCanvasContent('bvg'));
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  if (path.endsWith('.beam')) {
    if (!(await prepareCanvasContent('beam'))) {
      return false;
    }

    await fs.writeFile(path, await generateBeamBuffer());
    currentFileManager.setHasUnsavedChanges(false, false);

    return true;
  }

  return false;
};
