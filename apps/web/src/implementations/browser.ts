import type { IBrowser } from '@core/interfaces/IBrowser';

class WebBrowser implements IBrowser {
  open(url: string): void {
    window.open(url);
  }
}

const webBrowser = new WebBrowser();

export default webBrowser;
