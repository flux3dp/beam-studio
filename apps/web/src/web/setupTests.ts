/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import '@testing-library/jest-dom';

import $ from 'jquery';
import { enableFetchMocks } from 'jest-fetch-mock';
import { TextEncoder } from 'util';

declare global {
  interface Window {
    electron?: {
      ipc: any;
      events: { [key: string]: string };
      remote: any;
    };
    FLUX: {
      allowTracking: boolean;
      backendAlive: boolean;
      debug: boolean;
      dev: boolean;
      ghostPort: number;
      logfile?: any;
      timestamp: number;
      version: string;
      websockets: any;
    };
    os: 'MacOS' | 'Windows' | 'Linux' | 'others';
    requirejs: (deps: string[], callback: (...modules: any[]) => void) => void;
    $: any;
    jQuery: any;
    svgedit: any;
    svgCanvas: any;
    svgEditor: any;
    titlebar?: any;
    polygonAddSides: (val?: number) => void;
    polygonDecreaseSides: (val?: number) => void;
    updatePolygonSides: (elem: Element, val: number) => void;
  }
}

window.$ = $;
enableFetchMocks();
Object.defineProperty(window, 'os', {
  value: '',
  writable: true,
});
Object.defineProperty(window, 'FLUX', {
  value: {},
  writable: true,
});
Object.defineProperty(window, 'electron', {
  value: {},
  writable: true,
});
Object.defineProperty(window, 'svgedit', {
  value: {
    NS: {
      HTML: 'http://www.w3.org/1999/xhtml',
      MATH: 'http://www.w3.org/1998/Math/MathML',
      SE: 'http://svg-edit.googlecode.com',
      SVG: 'http://www.w3.org/2000/svg',
      XLINK: 'http://www.w3.org/1999/xlink',
      XML: 'http://www.w3.org/XML/1998/namespace',
      XMLNS: 'http://www.w3.org/2000/xmlns/',
      INKSCAPE: 'http://www.inkscape.org/namespaces/inkscape',
    },
    browser: {
      isTouch: () => false,
    },
  },
  writable: true,
});
if (!window.matchMedia) {
  Object.defineProperty(global.window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query) => ({
      matches: query.includes('max-width'),
      addListener: () => {},
      removeListener: () => {},
    }),
  });
}
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

const antdCssDevOnlyRegex = /css-dev-only-do-not-override-([A-Za-z0-9]*)/g;
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'string' && !!val.match(antdCssDevOnlyRegex),
  print: (val: string) =>
    `"${val.replace(antdCssDevOnlyRegex, 'css-dev-only-do-not-override-hash')}"`,
});

expect.addSnapshotSerializer({
  test: (val) => typeof val === 'string' && !!val.match(/ transform-origin: NaNpx NaNpx;/g),
  print: (val: string) => `"${val.replace(/ transform-origin: NaNpx NaNpx;/g, '')}"`,
})
