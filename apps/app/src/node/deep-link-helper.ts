import type { WebContentsView } from 'electron';

import { getFocusedView } from './helpers/tabHelper';

export const getDeepLinkUrl = (argv: string[]): string | undefined => argv.find((s) => s.startsWith('beam-studio://'));

export const handleDeepLinkUrl = (views: WebContentsView[], url: string): void => {
  if (url) {
    const urlObject = new URL(decodeURI(url));

    console.log(urlObject);

    const focusedView = getFocusedView() ?? views[0];

    if (urlObject.hostname === 'fb-auth') {
      focusedView.webContents.send('FB_AUTH_TOKEN', urlObject.hash.slice(1));
    } else if (urlObject.hostname === 'google-auth') {
      focusedView.webContents.send('GOOGLE_AUTH', urlObject.search.slice(1));
    }
  }
};

export default {
  getDeepLinkUrl,
  handleDeepLinkUrl,
};
