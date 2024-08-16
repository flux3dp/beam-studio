// eslint-disable-next-line import/no-extraneous-dependencies
import { BrowserWindow } from 'electron';

export const getDeeplinkUrl = (argv: string[]): string | undefined =>
  argv.find((s) => s.startsWith('beam-studio://'));

export const handleDeepLinkUrl = (mainWindow: BrowserWindow | null, url: string): void => {
  if (url) {
    const urlObject = new URL(decodeURI(url));
    console.log(urlObject);
    if (urlObject.hostname === 'fb-auth') {
      mainWindow?.webContents.send('FB_AUTH_TOKEN', urlObject.hash.slice(1));
    } else if (urlObject.hostname === 'google-auth') {
      mainWindow?.webContents.send('GOOGLE_AUTH', urlObject.search.slice(1));
    }
  }
};

export default {
  getDeeplinkUrl,
  handleDeepLinkUrl,
};
