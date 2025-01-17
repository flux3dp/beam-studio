// eslint-disable-next-line import/no-extraneous-dependencies
import electron from 'electron';
import { IBrowser } from 'interfaces/IBrowser';

class ElectronBrowser implements IBrowser {
  // eslint-disable-next-line class-methods-use-this
  open(url: string): void {
    electron.shell.openExternal(url);
  }
}

const electronBrowser = new ElectronBrowser();

export default electronBrowser;
