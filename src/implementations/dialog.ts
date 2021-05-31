/* eslint-disable import/no-extraneous-dependencies */
import { remote } from 'electron';

import { DialogFilter, IDialog, OpenDialogProperties } from 'interfaces/IDialog';

const { dialog } = remote;

export default {
  async showSaveDialog(
    title?: string,
    defaultPath?: string,
    filters?: DialogFilter[],
  ): Promise<string | null> {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title,
      defaultPath,
      filters,
    });
    return canceled ? null : filePath;
  },
  async showOpenDialog(options: {
    defaultPath?: string,
    filters?: DialogFilter[],
    properties?: OpenDialogProperties[],
  }): Promise<{
      canceled: boolean,
      filePaths: string[],
    }> {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      ...options,
      properties: !options.properties ? ['openFile'] : options.properties,
    });
    return Promise.resolve({
      canceled,
      filePaths,
    });
  },
} as IDialog;
