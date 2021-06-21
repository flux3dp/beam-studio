/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Backbone from 'backbone';
import { Color, Titlebar } from 'custom-electron-titlebar';

import globalEvents from 'app/actions/global';
import globalHelper from 'helpers/global-helper';

import communicator from 'implementations/communicator';
import loaderResult from './loader';
import Router from './router';

globalHelper.setWindowMember();
console.log('Loader success: ', loaderResult);

// const allowTracking = false;
declare global {
  var requireNode: (name: string) => any;
  interface Window {
    electron?: {
      ipc: any,
      events: { [key: string]: string; },
      version: string,
      trigger_file_input_click: (inputId: string) => void,
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
    backgroundColor: Color.fromHex('#333'),
    shadow: false,
    icon: 'win-title-icon.png',
  });
  titlebar.updateTitle(' ');
  window.titlebar = titlebar;
  communicator.on('UPDATE_CUSTOM_TITLEBAR', (e) => {
    window.dispatchEvent(new Event('mousedown'));
  });
}

export default function main(): void {
  console.log(`Beam-Studio: ${window['FLUX'].version}`);

  // if (allowTracking) {
  //   // google analytics
  //   $.getScript('/js/helpers/analytics.js');
  // }

  menuBar();

  globalEvents(function () {
    const router = new Router();
    Backbone.history.start();
  });
}

main();
