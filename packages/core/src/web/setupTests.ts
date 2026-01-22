import '@testing-library/jest-dom';

import { TextDecoder, TextEncoder } from 'util';

import { enableFetchMocks } from 'jest-fetch-mock';
import $ from 'jquery';

// Mock uuid module for ESM compatibility
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-v4',
}));

declare global {
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
    polygonAddSides: (val?: number) => void;
    polygonDecreaseSides: (val?: number) => void;
    requirejs: (deps: string[], callback: (...modules: any[]) => void) => void;
    svgCanvas: any;
    svgedit: any;
    svgEditor: any;
    titlebar?: any;
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
    browser: {
      isTouch: () => false,
    },
    NS: {
      HTML: 'http://www.w3.org/1999/xhtml',
      INKSCAPE: 'http://www.inkscape.org/namespaces/inkscape',
      MATH: 'http://www.w3.org/1998/Math/MathML',
      SE: 'http://svg-edit.googlecode.com',
      SVG: 'http://www.w3.org/2000/svg',
      XLINK: 'http://www.w3.org/1999/xlink',
      XML: 'http://www.w3.org/XML/1998/namespace',
      XMLNS: 'http://www.w3.org/2000/xmlns/',
    },
  },
  writable: true,
});

if (!window.matchMedia) {
  Object.defineProperty(global.window, 'matchMedia', {
    configurable: true,
    value: (query: string | string[]) => ({
      addListener: () => {},
      matches: query.includes('max-width'),
      removeListener: () => {},
    }),
    writable: true,
  });
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

const antdCssDevOnlyRegex = /css-dev-only-do-not-override-([A-Za-z0-9]*)/g;

expect.addSnapshotSerializer({
  print: (val) => `"${(val as string).replace(antdCssDevOnlyRegex, 'css-dev-only-do-not-override-hash')}"`,
  test: (val) => typeof val === 'string' && !!val.match(antdCssDevOnlyRegex),
});

expect.addSnapshotSerializer({
  print: (val) => `"${(val as string).replace(/ transform-origin: NaNpx NaNpx;/g, '')}"`,
  test: (val) => typeof val === 'string' && !!val.match(/ transform-origin: NaNpx NaNpx;/g),
});

global.structuredClone = (v) => JSON.parse(JSON.stringify(v));

class BroadcastChannelMock {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  onmessage() {}
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  onmessageerror() {}
  dispatchEvent() {
    return true;
  }
}
global.BroadcastChannel = BroadcastChannelMock;
