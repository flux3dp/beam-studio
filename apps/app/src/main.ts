/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { app, session } from '@electron/remote';
import { TitlebarColor, Titlebar } from 'custom-electron-titlebar';

// This module setup global window variable, Should be put at top
import globalHelper from 'helpers/global-helper';
import fileExportHelper from 'helpers/file-export-helper';
import globalEvents from 'app/actions/global';
import router from 'app/router';

import communicator from 'implementations/communicator';
import initBackendEvents from './init-backend-events';
import loaderResult from './loader';

globalHelper.setWindowMember();
console.log('Loader success: ', loaderResult);

// const allowTracking = false;
declare global {
  var requireNode: (name: string) => any;
  interface Window {
    electron?: {
      ipc: any,
      events: { [key: string]: string; },
      remote: any,
    },
    FLUX: {
      allowTracking: boolean,
      backendAlive: boolean,
      debug: boolean,
      dev: boolean,
      ghostPort: number,
      logfile?: any,
      timestamp: number,
      version: string,
      websockets: any,
    },
    os: 'MacOS' | 'Windows' | 'Linux' | 'others',
    requirejs: (deps: string[], callback: (...modules: any[]) => void) => void,
    $: any,
    jQuery: any,
    svgedit: any,
    svgCanvas: any,
    svgEditor: any,
    titlebar?: any,
  }
}

function menuBar() {
  if (window.os !== 'Windows') return;

  $('.content').css({ height: 'calc(100% - 30px)' });
  const titlebar = new Titlebar({
    backgroundColor: TitlebarColor.fromHex('#333'),
    shadow: false,
    icon: 'win-title-icon.png',
  });
  titlebar.updateTitle(' ');
  window.titlebar = titlebar;
  communicator.on('UPDATE_CUSTOM_TITLEBAR', () => {
    window.dispatchEvent(new Event('mousedown'));
  });
}

const setReferer = () => {
  const filter = {
    urls: ['https://id.flux3dp.com/*'],
  };
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    const header = {
      ...details.requestHeaders,
      Referer: 'https://id.flux3dp.com',
    };
    callback({ requestHeaders: header });
  });
};

export default function main(): void {
  window.FLUX.version = app.getVersion();
  console.log(`Beam-Studio: ${window.FLUX.version}`);

  setReferer();
  menuBar();
  communicator.on('WINDOW_CLOSE', async () => {
    const res = await fileExportHelper.toggleUnsavedChangedDialog();
    if (res) communicator.send('CLOSE_REPLY', true);
  });

  globalEvents(() => {
    router($('section.content')[0]);
  });
}

initBackendEvents();
main();
