import { dialog } from '@electron/remote';
import writeFileAtomic from 'write-file-atomic';

import type { DialogFilter, IDialog, OpenDialogProperties } from '@core/interfaces/IDialog';

const showSaveDialog = async (
  title?: string,
  defaultPath?: string,
  filters?: DialogFilter[],
): Promise<null | string | undefined> => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters,
    title,
  });

  return canceled ? null : filePath;
};

const showOpenDialog = async (options: {
  defaultPath?: string;
  filters?: DialogFilter[];
  properties?: OpenDialogProperties[];
}): Promise<{
  canceled: boolean;
  filePaths: string[];
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
  async getFileFromDialog(options: {
    defaultPath?: string;
    filters?: DialogFilter[];
    properties?: OpenDialogProperties[];
  }): Promise<File | null> {
    const { canceled, filePaths } = await dialog.showOpenDialog(options);

    if (canceled || !filePaths) {
      return null;
    }

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
  showOpenDialog,
  showSaveDialog,
  async writeFileDialog(
    getContent: () => Blob | Promise<Blob | string> | string,
    title?: string,
    defaultPath?: string,
    filters?: DialogFilter[],
  ): Promise<null | string> {
    const targetPath = await showSaveDialog(title, defaultPath, filters);

    if (targetPath) {
      const content = await getContent();

      if (typeof content === 'string') {
        await writeFileAtomic(targetPath, content);
      } else {
        const arrBuf = await content.arrayBuffer();
        const buf = Buffer.from(arrBuf);

        await writeFileAtomic(targetPath, buf);
      }

      return targetPath;
    }

    return null;
  },
} as IDialog;
