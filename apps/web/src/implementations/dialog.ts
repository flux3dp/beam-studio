/* eslint-disable ts/no-unused-vars */
import { saveAs } from 'file-saver';

import type { DialogFilter, IDialog, OpenDialogProperties } from '@core/interfaces/IDialog';

// window.showOpenFilePicker and window.showSaveFilePicker are another options.
// But they are not supported by Firefox currently.

const mimetypeMap: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  json: 'application/json',
  png: 'image/png',
  svg: 'image/svg+xml',
  txt: 'text/plain',
};

const input = document.createElement('input');

input.setAttribute('id', 'file-input');
document.body.append(input);

let lastPromiseResolve: ((result: { canceled?: boolean }) => void) | null;

const openFileDialog = (options: {
  defaultPath?: string;
  filters?: DialogFilter[];
  properties?: OpenDialogProperties[];
}): Promise<{ canceled?: boolean; filelist?: FileList | null; value?: string }> => {
  // TODO: defaultPath and contrain to file or directory
  if (lastPromiseResolve) {
    lastPromiseResolve({ canceled: true });
  }

  const { filters } = options;

  input.setAttribute('type', 'file');

  if (filters) {
    let acceptAll = false;

    // Accept all file for pads
    if ('ontouchstart' in window && ['MacOS', 'others'].includes((window as any).os as string)) {
      acceptAll = true;
    }

    const accept = [] as string[];

    for (let i = 0; i < filters.length; i += 1) {
      const filter = filters[i];

      for (let j = 0; j < filter.extensions.length; j += 1) {
        const extension = filter.extensions[j];

        if (extension === '*') {
          acceptAll = true;
          break;
        } else if (extension) {
          accept.push(`.${extension}`);
        }
      }

      if (acceptAll) {
        break;
      }
    }

    if (!acceptAll) {
      input.setAttribute('accept', accept.join(','));
    }
  }

  return new Promise((resolve) => {
    input.value = '';
    lastPromiseResolve = resolve;
    input.onchange = () => {
      const { files, value } = input;

      lastPromiseResolve = null;
      resolve({
        filelist: files,
        value,
      });
    };

    // input.addEventListener('')
    input.click();
  });
};

export default {
  async getFileFromDialog(options: {
    defaultPath?: string;
    filters?: DialogFilter[];
    properties?: OpenDialogProperties[];
  }): Promise<Blob | File | null> {
    const { canceled, filelist } = await openFileDialog(options);

    if (canceled || !filelist) {
      return null;
    }

    return filelist[0];
  },
  async showOpenDialog(options: {
    defaultPath?: string;
    filters?: DialogFilter[];
    properties?: OpenDialogProperties[];
  }): Promise<{
    canceled: boolean;
    filePaths: string[];
  }> {
    const { value } = await openFileDialog(options);

    return {
      canceled: false,
      filePaths: value ? [value] : [],
    };
  },
  async showSaveDialog(title?: string, defaultPath?: string, filters?: DialogFilter[]): Promise<null | string> {
    return Promise.resolve(null);
  },
  async writeFileDialog(
    getContent: () => Blob | Promise<Blob | string> | string,
    title?: string,
    defaultPath?: string,
    filters?: DialogFilter[],
  ): Promise<null | string> {
    const content = await getContent();
    let dataType;
    let fileName = defaultPath || '';

    if (filters && filters.length > 0) {
      const extension = filters[0].extensions[0];

      if (extension && extension !== '*') {
        if (extension in mimetypeMap) {
          dataType = mimetypeMap[extension];
        } else if (!fileName.includes('.')) {
          fileName = `${fileName}.${extension}`;
        }
      }
    }

    const data = new Blob([content], { type: dataType });

    if (fileName.startsWith('.')) {
      fileName = ` ${fileName}`;
    }

    saveAs(data, fileName);

    return null;
  },
} as IDialog;
