import { app, session } from '@electron/remote';
import { Titlebar, TitlebarColor } from 'custom-electron-titlebar';

import globalEvents from '@core/app/actions/global';
import router from '@core/app/router';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import { setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import { getOS } from '@core/helpers/getOS';
import communicator from '@core/implementations/communicator';

import initBackendEvents from './init-backend-events';

import './loader';

declare global {
  var requireNode: (_name: string) => any;

  interface Window {
    $: any;
    electron?: {
      events: { [key: string]: string };
      ipc: any;
      remote: any;
    };
    FLUX: {
      allowTracking: boolean;
      backendAlive: boolean;
      debug: boolean;
      dev: boolean;
      ghostPort: number;
      logFile?: any;
      timestamp: number;
      version: string;
      websockets: any;
    };
    jQuery: any;
    os: 'Linux' | 'MacOS' | 'others' | 'Windows';
    requirejs: (_deps: string[], _callback: (..._modules: any[]) => void) => void;
    svgCanvas: any;
    svgedit: any;
    svgEditor: any;
    titlebar?: any;
  }
}

function menuBar() {
  if (getOS() !== 'Windows') {
    return;
  }

  $('.content').css({ height: 'calc(100% - 30px)' });

  const titlebar = new Titlebar({
    backgroundColor: TitlebarColor.fromHex('#333'),
    icon: 'win-title-icon.png',
    shadow: false,
  });

  titlebar.updateTitle(' ');
  window.titlebar = titlebar;
  communicator.on('UPDATE_CUSTOM_TITLEBAR', () => {
    window.dispatchEvent(new Event('mousedown'));
  });
}

const setReferer = () => {
  const filter = { urls: ['https://id.flux3dp.com/*', 'https://id-test.flux3dp.com/*'] };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    const referer = /https:\/\/id(-test)?.flux3dp.com/.exec(details.url);
    const header = details.requestHeaders;

    if (referer) header['Referer'] = referer[0];

    // Send new object to make sure header is updated
    callback({ requestHeaders: { ...header } });
  });
};

export default function main(): void {
  window.FLUX.version = app.getVersion();
  console.log(`Beam-Studio: ${window.FLUX.version}`);

  setReferer();
  menuBar();

  communicator.on('open-file', (_event: any, filePath: string) => {
    if (filePath) {
      // Use the helper to open the file in a new tab
      setFileInAnotherTab({ filePath, type: 'open' });
    }
  });

  communicator.on('WINDOW_CLOSE', async () => {
    const res = await toggleUnsavedChangedDialog();

    if (res) {
      communicator.send('CLOSE_REPLY', true);
    }
  });

  globalEvents(() => {
    $('body').addClass(getOS().toLowerCase());
    router($('section.content')[0]);
  });
}

initBackendEvents();
main();
