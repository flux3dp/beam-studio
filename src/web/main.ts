const allowTracking = false;

import $ from 'jquery';
import Backbone from 'backbone';
import Router from './app/router';
import globalEvents from './app/actions/global';
import menuBar from './helpers/menubar';

declare global {
  var requireNode: (name: string) => any;
  interface Window {
    electron: {
      ipc: any,
      events: { [key: string]: string; },
      version: string,
      trigger_file_input_click: (inputId: string) => void,
    },
  }
}

export default function main() {
  console.log(`Beam-Studio: ${window['FLUX'].version}`);

  if (allowTracking) {
    // google analytics
    $.getScript('/js/helpers/analytics.js');
  }

  menuBar();

  globalEvents(function () {
    const router = new Router();
    Backbone.history.start();
  });
}
