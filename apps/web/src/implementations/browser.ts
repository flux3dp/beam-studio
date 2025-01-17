import { IBrowser } from 'core-interfaces/IBrowser';

class WebBrowser implements IBrowser {
  // eslint-disable-next-line class-methods-use-this
  open(url: string): void {
    window.open(url);
  }
}

const webBrowser = new WebBrowser();

export default webBrowser;
