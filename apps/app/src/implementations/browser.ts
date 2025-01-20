import electron from 'electron';

import type { IBrowser } from '@core/interfaces/IBrowser';

class ElectronBrowser implements IBrowser {
  open(url: string): void {
    electron.shell.openExternal(url);
  }
}

const electronBrowser = new ElectronBrowser();

export default electronBrowser;
