/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import { dialog } from '@electron/remote';

import { DialogFilter, IDialog, OpenDialogProperties } from 'interfaces/IDialog';

const showSaveDialog = async (
  title?: string,
  defaultPath?: string,
  filters?: DialogFilter[],
): Promise<string | null> => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title,
    defaultPath,
    filters,
  });
  return canceled ? null : filePath;
};

const showOpenDialog = async (options: {
  defaultPath?: string,
  filters?: DialogFilter[],
  properties?: OpenDialogProperties[],
}): Promise<{
  canceled: boolean,
  filePaths: string[],
}> => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    ...options,
    properties: !options.properties ? ['openFile'] : options.properties,
  });
  return Promise.resolve({
    canceled,
    filePaths,
  });
};

export default {
  showSaveDialog,
  async writeFileDialog(
    getContent: () => string | Blob | Promise<string | Blob>,
    title?: string,
    defaultPath?: string,
    filters?: DialogFilter[],
  ): Promise<string | null> {
    const targetPath = await showSaveDialog(title, defaultPath, filters);
    if (targetPath) {
      const content = await getContent();
      if (typeof content === 'string') {
        fs.writeFileSync(targetPath, content);
      } else {
        const arrBuf = await content.arrayBuffer();
        const buf = Buffer.from(arrBuf);
        fs.writeFileSync(targetPath, buf);
      }
      return targetPath;
    }
    return null;
  },
  showOpenDialog,
  async getFileFromDialog(options: {
    defaultPath?: string,
    filters?: DialogFilter[],
    properties?: OpenDialogProperties[],
  }): Promise<File> {
    const { canceled, filePaths } = await dialog.showOpenDialog(options);
    if (canceled || !filePaths) return null;
    const filePath = filePaths[0];
    const fetchPath = filePath.replaceAll('#', '%23');
    const resp = await fetch(fetchPath);
    const fileBlob = await resp.blob();
    const file = new File([fileBlob], filePath, { type: fileBlob.type });
    Object.defineProperty(file, 'path', {
      value: filePath,
    });
    return file;
  },
} as IDialog;
